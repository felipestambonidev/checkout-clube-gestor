async function seedCoupons() {
  console.log("Calling seed API to populate DynamoDB with coupons...\n");

  // Try multiple ports commonly used in the sandbox
  const ports = [3000, 3001, 3002];
  
  for (const port of ports) {
    const baseUrl = `http://localhost:${port}`;
    console.log(`Trying ${baseUrl}/api/seed ...`);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${baseUrl}/api/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      const data = await response.json();

      if (!response.ok) {
        console.error(`Seed failed on port ${port}:`, data.error);
        continue;
      }

      console.log("\nResult:", JSON.stringify(data, null, 2));
      console.log("\nDone!");
      return;
    } catch (error) {
      console.log(`Port ${port} failed: ${error.message}`);
    }
  }

  console.error("\nCould not connect to any port. Make sure the dev server is running.");
  console.log("You can also manually call POST /api/seed from the browser or a tool like curl.");
  process.exit(1);
}

seedCoupons();
