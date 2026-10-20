import type * as NM from "@nomake/core";

export interface Project {
  outputs: NM.Target[];
  check: NM.Target;
  tests: NM.Target;
}
