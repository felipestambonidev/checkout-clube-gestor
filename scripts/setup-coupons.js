const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { awsCredentialsProvider } = require("@vercel/functions/oidc");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
  }),
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const tableName = process.env.DYNAMODB_TABLE_NAME;

async function setupCoupons() {
  const coupons = [
    {
      PK: "COUPON#DESCONTO100",
      code: "DESCONTO100",
      discount: 100,
      isUsed: false,
      createdAt: new Date().toISOString(),
    },
    {
      PK: "COUPON#PROMO50",
      code: "PROMO50",
      discount: 50,
      isUsed: false,
      createdAt: new Date().toISOString(),
    },
    {
      PK: "COUPON#BEMVINDO",
      code: "BEMVINDO",
      discount: 100,
      isUsed: false,
      createdAt: new Date().toISOString(),
    },
  ];

  console.log(`Setting up coupons in table: ${tableName}`);

  for (const coupon of coupons) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: coupon,
        })
      );
      console.log(`✓ Created coupon: ${coupon.code} (${coupon.discount}% off)`);
    } catch (error) {
      console.error(`✗ Error creating coupon ${coupon.code}:`, error.message);
    }
  }

  console.log("\nCoupons setup completed!");
}

setupCoupons().catch(console.error);
