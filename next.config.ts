import type { NextConfig } from "next";
import { validateProductionEnvironment } from "./lib/env";

validateProductionEnvironment();
const config: NextConfig = { output: "standalone", poweredByHeader: false };
export default config;
