const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 10000;

/*
|--------------------------------------------------------------------------
| Firebase Admin
|--------------------------------------------------------------------------
*/

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        .replace(/^["']|["']$/g, "")
        .replace(/\\n/g, "\n")
        .trim()
    })
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/*
|--------------------------------------------------------------------------
| Razorpay
|--------------------------------------------------------------------------
*/

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (
    !origin ||
    allowedOrigins.length === 0 ||
    allowedOrigins.includes(origin)
  ) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    service: "SMV ASTRO Razorpay Backend",
    status: "online",
    razorpay: "enabled",
    firebase: "enabled"
  });
});

/*
|--------------------------------------------------------------------------
| Create Razorpay Order
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Amount must be supplied in RUPEES from frontend.
| Example:
| ₹501 -> amount: 501
|
*/

app.post(
  "/create-order",
  express.json(),
  async (req, res) => {
    try {
      const {
        amount,
        serviceName,
        customerName,
        customerEmail,
        customerPhone,
        firebaseUid
      } = req.body;

      if (!amount) {
        return res.status(400).json({
          error: "Amount is required"
        });
      }

      const rupees = Number(amount);

      if (!Number.isFinite(rupees) || rupees <= 0) {
        return res.status(400).json({
          error: "Invalid amount"
        });
      }

      const amountInPaise = Math.round(rupees * 100);

      /*
      |--------------------------------------------------------------------------
      | Razorpay Order
      |--------------------------------------------------------------------------
      */

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt:
          "SMV_" +
          Date.now() +
          "_" +
          crypto.randomBytes(4).toString("hex"),

        notes: {
          serviceName: serviceName || "Astrology Consultation",
          customerName: customerName || "",
          customerEmail: customerEmail || "",
          customerPhone: customerPhone || "",
          firebaseUid: firebaseUid || ""
        }
      });

      /*
      |--------------------------------------------------------------------------
      | Store Order in Firestore
      |--------------------------------------------------------------------------
      */

      await db
        .collection("razorpay_orders")
        .doc(order.id)
        .set({
          razorpayOrderId: order.id,

          amount: order.amount,
          currency: order.currency,

          serviceName:
            serviceName || "Astrology Consultation",

          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,

          firebaseUid: firebaseUid || null,

          status: "created",

          createdAt: FieldValue.serverTimestamp()
        });

      /*
      |--------------------------------------------------------------------------
      | Return only public information
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        keyId: process.env.RAZORPAY_KEY_ID,

        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency
        }
      });

    } catch (error) {

      console.error(
        "Create order error:",
        error
      );

      return res.status(500).json({
        error: "Unable to create Razorpay order"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Razorpay Payment Signature Verification
|--------------------------------------------------------------------------
*/

app.post(
  "/verify-payment",
  express.json(),
  async (req, res) => {
    try {

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          error: "Payment verification data missing"
        });
      }

      const generatedSignature =
        crypto
          .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
          )
          .update(
            razorpay_order_id +
            "|" +
            razorpay_payment_id
          )
          .digest("hex");

      const valid =
        generatedSignature.length ===
          razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(generatedSignature),
          Buffer.from(razorpay_signature)
        );

      if (!valid) {

        console.error(
          "Invalid Razorpay payment signature"
        );

        return res.status(401).json({
          success: false,
          error: "Invalid payment signature"
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Update Firestore Order
      |--------------------------------------------------------------------------
      */

      await db
        .collection("razorpay_orders")
        .doc(razorpay_order_id)
        .set(
          {
            razorpayPaymentId:
              razorpay_payment_id,

            status: "verified",

            verifiedAt:
              FieldValue.serverTimestamp()
          },
          {
            merge: true
          }
        );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully"
      });

    } catch (error) {

      console.error(
        "Payment verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Payment verification failed"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
*/

app.post(
  "/razorpay/webhook",
  express.raw({
    type: "application/json"
  }),
  async (req, res) => {

    try {

      const signature =
        req.get("X-Razorpay-Signature");

      const secret =
        process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !secret) {

        console.error(
          "Webhook configuration missing"
        );

        return res
          .status(400)
          .send("Invalid webhook configuration");
      }

      /*
      |--------------------------------------------------------------------------
      | Verify Webhook Signature
      |--------------------------------------------------------------------------
      */

      const expectedSignature =
        crypto
          .createHmac("sha256", secret)
          .update(req.body)
          .digest("hex");

      const valid =
        signature.length ===
          expectedSignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );

      if (!valid) {

        console.error(
          "Invalid Razorpay webhook signature"
        );

        return res
          .status(401)
          .send("Invalid signature");
      }

      /*
      |--------------------------------------------------------------------------
      | Parse Event
      |--------------------------------------------------------------------------
      */

      const event =
        JSON.parse(
          req.body.toString("utf8")
        );

      const eventType =
        event.event || "unknown";

      const paymentEntity =
        event?.payload?.payment?.entity ||
        null;

      const orderEntity =
        event?.payload?.order?.entity ||
        null;

      const razorpayPaymentId =
        paymentEntity?.id || null;

      const razorpayOrderId =
        orderEntity?.id ||
        paymentEntity?.order_id ||
        null;

      /*
      |--------------------------------------------------------------------------
      | Event Id
      |--------------------------------------------------------------------------
      */

      const eventKey =
        razorpayPaymentId ||
        razorpayOrderId ||
        crypto
          .createHash("sha256")
          .update(req.body)
          .digest("hex");

      const webhookRef =
        db
          .collection(
            "razorpay_webhook_events"
          )
          .doc(eventKey);

      /*
      |--------------------------------------------------------------------------
      | Duplicate Protection
      |--------------------------------------------------------------------------
      */

      const existingEvent =
        await webhookRef.get();

      if (existingEvent.exists) {

        console.log(
          "Duplicate webhook ignored:",
          eventKey
        );

        return res
          .status(200)
          .send("OK");
      }

      /*
      |--------------------------------------------------------------------------
      | Store Webhook
      |--------------------------------------------------------------------------
      */

      await webhookRef.set({

        event: eventType,

        razorpayPaymentId,
        razorpayOrderId,

        status:
          paymentEntity?.status ||
          orderEntity?.status ||
          null,

        amount:
          paymentEntity?.amount ||
          orderEntity?.amount ||
          null,

        currency:
          paymentEntity?.currency ||
          orderEntity?.currency ||
          null,

        receivedAt:
          FieldValue.serverTimestamp(),

        processed: false
      });

      /*
      |--------------------------------------------------------------------------
      | Update Order
      |--------------------------------------------------------------------------
      */

      if (razorpayOrderId) {

        let newStatus = null;

        if (
          eventType ===
          "payment.captured"
        ) {
          newStatus = "paid";
        }

        if (
          eventType ===
          "order.paid"
        ) {
          newStatus = "paid";
        }

        if (
          eventType ===
          "payment.failed"
        ) {
          newStatus = "failed";
        }

        if (newStatus) {

          await db
            .collection(
              "razorpay_orders"
            )
            .doc(razorpayOrderId)
            .set(
              {
                status: newStatus,

                razorpayPaymentId:
                  razorpayPaymentId,

                lastWebhookEvent:
                  eventType,

                updatedAt:
                  FieldValue.serverTimestamp()
              },
              {
                merge: true
              }
            );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Logs
      |--------------------------------------------------------------------------
      */

      console.log(
        "Razorpay event:",
        eventType,
        eventKey
      );

      return res
        .status(200)
        .send("OK");

    } catch (error) {

      console.error(
        "Webhook processing error:",
        error
      );

      return res
        .status(500)
        .send(
          "Webhook processing failed"
        );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `SMV ASTRO Razorpay backend running on port ${PORT}`
    );

  }
);
