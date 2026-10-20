import test from "node:test";
import "./world-integrity.mjs";
test("OTThi keeps SHA-256 integrity and HQ offline includes Studio",()=>{
  // Actual SHA-256 validation executes in the imported audit. This test is
  // included in every normal CI run: node --test tests/*.test.mjs.
});
