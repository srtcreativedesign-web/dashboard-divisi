const fs = require("fs");
let content = fs.readFileSync("apps/web/src/layout/AppLayout.tsx", "utf8");

const target = "'/accounting/operasional': ClipboardList,";
const insertion = "'/accounting/operasional': ClipboardList,\n  '/accounting/storan': DollarSign,\n  '/accounting/stok': Package,\n  '/accounting/audit-kursi': ShieldAlert,\n  '/accounting/komisi': Users,";

content = content.replace(target, insertion);
fs.writeFileSync("apps/web/src/layout/AppLayout.tsx", content, "utf8");
console.log("ICON_MAP updated!");
