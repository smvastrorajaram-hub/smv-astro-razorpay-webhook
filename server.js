const express = require("express");
const crypto = require("crypto");
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
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    service: "SMV ASTRO Razorpay Webhook",
    status: "online"
  });
});

/*
|--------------------------------------------------------------------------
| Razorpay Webhook
|--------------------------------------------------------------------------
*/

app.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.get("X-Razorpay-Signature");
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !secret) {
        console.error("Webhook configuration missing");
        return res.status(400).send("Invalid webhook configuration");
      }

      /*
      |--------------------------------------------------------------------------
      | Verify Razorpay Signature
      |--------------------------------------------------------------------------
      */

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      const valid =
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );

      if (!valid) {
        console.error("Invalid Razorpay webhook signature");
        return res.status(401).send("Invalid signature");
      }

      /*
      |--------------------------------------------------------------------------
      | Parse Event
      |--------------------------------------------------------------------------
      */

      const event = JSON.parse(req.body.toString("utf8"));

      const eventType = event.event || "unknown";

      const paymentEntity = event?.payload?.payment?.entity || null;
      const orderEntity = event?.payload?.order?.entity || null;

      const razorpayPaymentId = paymentEntity?.id || null;

      const razorpayOrderId =
        orderEntity?.id ||
        paymentEntity?.order_id ||
        null;

      /*
      |--------------------------------------------------------------------------
      | Idempotency Key
      |--------------------------------------------------------------------------
      */

      const eventKey =
        razorpayPaymentId ||
        razorpayOrderId ||
        crypto
          .createHash("sha256")
          .update(req.body)
          .digest("hex");

      const webhookRef = db
        .collection("razorpay_webhook_events")
        .doc(eventKey);

      /*
      |--------------------------------------------------------------------------
      | Duplicate Protection
      |--------------------------------------------------------------------------
      */

      const existingEvent = await webhookRef.get();

      if (existingEvent.exists) {
        console.log(
          "Duplicate Razorpay webhook ignored:",
          eventKey
        );

        return res.status(200).send("OK");
      }

      /*
      |--------------------------------------------------------------------------
      | Store Webhook Event
      |--------------------------------------------------------------------------
      */

      await webhookRef.set({
        event: eventType,

        razorpayPaymentId,
        razorpayOrderId,

        status:
          paymentEntity?.status ||
          null,

        amount:
          paymentEntity?.amount ||
          orderEntity?.amount ||
          null,

        currency:
          paymentEntity?.currency ||
          orderEntity?.currency ||
          null,

        receivedAt: FieldValue.serverTimestamp(),

        processed: false
      });

      console.log(
        "Razorpay event stored:",
        eventType,
        eventKey
      );

      /*
      |--------------------------------------------------------------------------
      | Basic Payment Event Processing
      |--------------------------------------------------------------------------
      */

      if (eventType === "payment.captured") {
        console.log(
          "Payment captured:",
          razorpayPaymentId
        );
      }

      if (eventType === "payment.failed") {
        console.log(
          "Payment failed:",
          razorpayPaymentId
        );
      }

      if (eventType === "order.paid") {
        console.log(
          "Order paid:",
          razorpayOrderId
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Acknowledge Razorpay
      |--------------------------------------------------------------------------
      */

      return res.status(200).send("OK");

    } catch (error) {
      console.error("Webhook processing error:", error);

      return res
        .status(500)
        .send("Webhook processing failed");
    }
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `SMV ASTRO webhook running on port ${PORT}`
  );
});
