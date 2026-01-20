const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { awsCredentialsProvider } = require("@vercel/functions/oidc");

async function seedCoupons() {
  console.log("🚀 Starting coupon seeding...\n");

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

  console.log(`📋 Table: ${tableName}`);
  console.log(`🔑 Partition Key: ${partitionKey}\n`);

  const coupons = [
    {
      code: "DESCONTO100",
      discount: 100,
      description: "Desconto de 100% - Entrada gratuita",
    },
    {
      code: "PROMO50",
      discount: 50,
      description: "Desconto de 50%",
    },
    {
      code: "BEMVINDO",
      discount: 100,
      description: "Cupom de boas-vindas - 100% off",
    },
  ];

  for (const coupon of coupons) {
    try {
      const item = {
        [partitionKey]: `COUPON#${coupon.code}`,
        code: coupon.code,
        discount: coupon.discount,
        description: coupon.description,
        isUsed: false,
        createdAt: new Date().toISOString(),
      };

      const command = new PutCommand({
        TableName: tableName,
        Item: item,
      });

      await docClient.send(command);
      console.log(`✅ Cupom criado: ${coupon.code} (${coupon.discount}% desconto)`);
    } catch (error) {
      console.error(`❌ Erro ao criar cupom ${coupon.code}:`, error.message);
    }
  }

  console.log("\n✨ Seeding concluído!");
}

seedCoupons().catch((error) => {
  console.error("💥 Erro fatal:", error);
  process.exit(1);
});
