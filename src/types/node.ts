/**
 * Core data types for Pipeline - The Data Sovereignty Layer
 *
 * Every piece of data in Pipeline is a semantic research object, not a file.
 * These types define the structure of nodes and their relationships.
 */

// Node types that can exist in the system
export type NodeType =
  | 'text'
  | 'heading'
  | 'database'
  | 'formula'
  | 'logic'
  | 'embed'
  | 'axiom'
  | 'theorem'
  | 'claim'
  | 'evidence'
  | 'paper'
  | 'note';

// Access tiers for permissions
export type AccessTier = 'owner' | 'collaborator' | 'viewer' | 'public' | 'ai_consumer';

// Node status in the workflow
export type NodeStatus = 'draft' | 'review' | 'canonical';

// Research domains
export type Domain =
  | 'physics'
  | 'theology'
  | 'consciousness'
  | 'methodology'
  | 'general';

/**
 * Core Node interface - represents a semantic research object
 */
export interface Node {
  uuid: string;
  type: NodeType;
  title: string;
  content: string;

  metadata: NodeMetadata;
  relationships: NodeRelationships;
  access: NodeAccess;
  logic?: LogicBlock[];
}

/**
 * Metadata about the node
 */
export interface NodeMetadata {
  created: Date;
  modified: Date;
  version: string;
  confidence?: number;  // 0.0 - 1.0 for research objects
  status: NodeStatus;
  domain?: Domain;
  tags?: string[];
}

/**
 * Relationships between nodes
 */
export interface NodeRelationships {
  parent?: string;          // UUID of parent node
  children?: string[];      // UUIDs of child nodes
  depends_on?: string[];    // This node depends on these
  supports?: string[];      // This node supports these
  contradicts?: string[];   // This node contradicts these
  part_of?: string;         // UUID of containing paper/document
  references?: string[];    // Referenced nodes
}

/**
 * Access control for the node
 */
export interface NodeAccess {
  owner: string;
  tier: AccessTier;
  encryption?: 'aes-256-gcm' | 'none';
  allowed_consumers?: string[];
  denied_consumers?: string[];
}

/**
 * Logic block - automation rules attached to nodes
 */
export interface LogicBlock {
  id: string;
  trigger: LogicTrigger;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
}

export type LogicTrigger =
  | 'on_save'
  | 'on_open'
  | 'on_edit'
  | 'on_schedule'
  | 'manual';

/**
 * Condition for logic execution
 */
export interface Condition {
  type: ConditionType;
  params: Record<string, unknown>;
  negate?: boolean;
}

export type ConditionType =
  | 'word_count'
  | 'contains'
  | 'tag_present'
  | 'date_compare'
  | 'confidence_threshold'
  | 'custom';

/**
 * Action to execute
 */
export interface Action {
  type: ActionType;
  params: Record<string, unknown>;
}

export type ActionType =
  | 'add_tag'
  | 'remove_tag'
  | 'move_to'
  | 'notify'
  | 'call_ai'
  | 'run_formula'
  | 'export'
  | 'update_confidence'
  | 'create_link';

/**
 * Audit log entry for tracking changes
 */
export interface AuditEntry {
  timestamp: Date;
  action: 'created' | 'modified' | 'deleted' | 'exported' | 'accessed';
  by: string;
  diff_hash?: string;
  details?: string;
}

/**
 * File representation (how a node is stored on disk)
 */
export interface PipelineFile {
  path: string;
  frontmatter: NodeFrontmatter;
  content: string;
  lastModified: Date;
}

/**
 * YAML frontmatter structure (Obsidian-compatible)
 */
export interface NodeFrontmatter {
  uuid: string;
  type: NodeType;
  title?: string;
  created: string;      // ISO date string
  modified: string;     // ISO date string
  version: string;
  confidence?: number;
  status: NodeStatus;
  domain?: Domain;
  tags?: string[];
  public: boolean;
  access_tier: AccessTier;
  relationships?: {
    depends_on?: string[];
    supports?: string[];
    contradicts?: string[];
    part_of?: string;
    references?: string[];
  };
  logic?: SerializedLogicBlock[];
}

/**
 * Serialized logic block for YAML frontmatter
 */
export interface SerializedLogicBlock {
  trigger: LogicTrigger;
  conditions?: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
  actions: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
}

/**
 * Create a new node with default values
 */
export function createNode(partial: Partial<Node> & { uuid: string; title: string }): Node {
  const now = new Date();
  return {
    uuid: partial.uuid,
    type: partial.type ?? 'note',
    title: partial.title,
    content: partial.content ?? '',
    metadata: {
      created: partial.metadata?.created ?? now,
      modified: partial.metadata?.modified ?? now,
      version: partial.metadata?.version ?? '1.0.0',
      status: partial.metadata?.status ?? 'draft',
      domain: partial.metadata?.domain,
      tags: partial.metadata?.tags ?? [],
      confidence: partial.metadata?.confidence,
    },
    relationships: {
      parent: partial.relationships?.parent,
      children: partial.relationships?.children ?? [],
      depends_on: partial.relationships?.depends_on ?? [],
      supports: partial.relationships?.supports ?? [],
      contradicts: partial.relationships?.contradicts ?? [],
      references: partial.relationships?.references ?? [],
    },
    access: {
      owner: partial.access?.owner ?? 'local',
      tier: partial.access?.tier ?? 'owner',
      encryption: partial.access?.encryption ?? 'none',
      allowed_consumers: partial.access?.allowed_consumers ?? [],
      denied_consumers: partial.access?.denied_consumers ?? [],
    },
    logic: partial.logic ?? [],
  };
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
