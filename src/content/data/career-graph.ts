export {
  patterns,
  patternList,
  patternIds,
  isPatternId,
  parsePatternIds,
  patternColorVar,
  patternColorStyle,
  type PatternId,
  type PatternMeta,
} from "./career-graph-patterns";

export { nodes, type NodeId, type CareerNode } from "./career-graph-nodes";

export {
  nodeHref,
  getNode,
  PUBLISHED_CASE_STUDY_SLUGS,
} from "./career-graph-node-helpers";

export { edges, type CareerEdge } from "./career-graph-edges";

export { projectToSvg, type SvgPadding } from "./career-graph-projection";
