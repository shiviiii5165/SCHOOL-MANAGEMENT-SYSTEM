require('dotenv').config();
const { Cashfree: CashfreeSDK, CFEnvironment } = require("cashfree-pg");

const cashfree = new CashfreeSDK(
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY,
  CFEnvironment.SANDBOX
);

async function testOrder() {
  try {
    const orderRequest = {
      order_id: `TEST_${Date.now()}`,
      order_amount: 1,
      order_currency: "INR",
      customer_details: {
        customer_id: "TEST_CUST_123",
        customer_name: "Test User",
        customer_email: "test@example.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: "http://localhost:3000/parent/fees?order_id=TEST_123",
      },
      order_note: "Test payment",
    };

    const response = await cashfree.PGCreateOrder("2023-08-01", orderRequest);
    console.log("Success:", response.data);
  } catch (err) {
    console.error("Error creating order:");
    if (err.response && err.response.data) {
      console.error(err.response.data);
    } else {
      console.error(err.message || err);
    }
  }
}

testOrder();
