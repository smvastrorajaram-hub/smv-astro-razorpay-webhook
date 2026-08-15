const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.status(200).json({
    service: "SMV ASTRO Razorpay Webhook",
    status: "online"
  });
});

app.post(
  "/razorpay/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.get("X-Razorpay-Signature");
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return res.status(400).send("Invalid webhook configuration");
      }

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
        return res.status(401).send("Invalid signature");
      }

      const event = JSON.parse(req.body.toString("utf8"));

      console.log("Razorpay event:", event.event);

      return res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).send("Webhook processing failed");
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SMV ASTRO webhook running on port ${PORT}`);
});
