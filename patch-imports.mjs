import fs from "fs";

let content = fs.readFileSync("app/page.tsx", "utf-8");

// Add Spinner to imports
content = content.replace(
  'import { Button, Card, Pill, Accordion } from "@/components/ui";',
  'import { Button, Card, Pill, Accordion, Spinner } from "@/components/ui";'
);

fs.writeFileSync("app/page.tsx", content);
console.log("Import patched.");
