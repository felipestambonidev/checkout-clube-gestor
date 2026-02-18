import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

async function seedCoupons() {
  console.log("Starting coupon seeding for new DynamoDB table...\n");

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
  const partitionKey = process.env.DYNAMODB_TABLE_PARTITION_KEY;

  console.log(`Table: ${tableName}`);
  console.log(`Partition Key: ${partitionKey}\n`);

  // First, check if there are already coupons in the table
  try {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const existingCoupons = (scanResult.Items || []).filter(
      (item) => item[partitionKey]?.startsWith("COUPON#")
    );

    if (existingCoupons.length > 0) {
      console.log(`Found ${existingCoupons.length} existing coupons:`);
      existingCoupons.forEach((c) => {
        console.log(`  - ${c.code} (${c.discount}% off, maxUses: ${c.maxUses || "N/A"}, usedBy: ${c.usedBy ? c.usedBy.length : 0})`);
      });
      console.log("\nTable already has data. Skipping seed.");
      return;
    }
  } catch (error) {
    console.log("Could not scan existing data, proceeding with seed:", error.message);
  }

  // These are the default coupons that were in the previous database
  const coupons = [
    {
      code: "DESCONTO100",
      discount: 100,
      maxUses: 100,
      description: "Desconto de 100% - Entrada gratuita",
    },
    {
      code: "PROMO100",
      discount: 100,
      maxUses: 100,
      description: "Promocao especial - 100% off",
    },
    {
      code: "BEMVINDO",
      discount: 100,
      maxUses: 100,
      description: "Cupom de boas-vindas - 100% off",
    },
  ];

  for (const coupon of coupons) {
    try {
      const item = {
        [partitionKey]: `COUPON#${coupon.code}`,
        code: coupon.code,
        discount: coupon.discount,
        maxUses: coupon.maxUses,
        description: coupon.description,
        usedBy: [],
        createdAt: new Date().toISOString(),
      };

      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await docClient.send(command);
      console.log(`Created coupon: ${coupon.code} (${coupon.discount}% off, maxUses: ${coupon.maxUses})`);
    } catch (error) {
      console.error(`Error creating coupon ${coupon.code}:`, error.message);
    }
  }

  console.log("\nSeeding complete! All coupons created successfully.");
}

seedCoupons().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
