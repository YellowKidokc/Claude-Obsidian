/**
 * YAML Frontmatter Parser
 *
 * Handles parsing and serializing YAML frontmatter for Obsidian-compatible markdown files.
 * Format:
 * ---
 * uuid: abc-123
 * type: note
 * ...
 * ---
 * # Markdown content here
 */

import * as yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';
import type {
  Node,
  NodeFrontmatter,
  PipelineFile,
  NodeType,
  NodeStatus,
  AccessTier,
  Domain,
  SerializedLogicBlock,
  ConditionType,
  ActionType,
} from '../types';

// Regex to match YAML frontmatter block
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parse a markdown file with YAML frontmatter
 */
export function parseMarkdownFile(content: string, filePath: string): PipelineFile {
  const match = content.match(FRONTMATTER_REGEX);

  let frontmatter: NodeFrontmatter;
  let markdownContent: string;

  if (match) {
    try {
      const parsed = yaml.parse(match[1]) as Partial<NodeFrontmatter>;
      frontmatter = validateAndNormalizeFrontmatter(parsed, filePath);
      markdownContent = content.slice(match[0].length);
    } catch (error) {
      console.error('Failed to parse frontmatter:', error);
      frontmatter = createDefaultFrontmatter(filePath);
      markdownContent = content;
    }
  } else {
    frontmatter = createDefaultFrontmatter(filePath);
    markdownContent = content;
  }

  return {
    path: filePath,
    frontmatter,
    content: markdownContent.trim(),
    lastModified: new Date(),
  };
}

/**
 * Serialize a node back to markdown with frontmatter
 */
export function serializeToMarkdown(node: Node): string {
  const frontmatter = nodeToFrontmatter(node);
  const yamlString = yaml.stringify(frontmatter, {
    indent: 2,
    lineWidth: 0, // Disable line wrapping
  });

  return `---\n${yamlString}---\n\n${node.content}`;
}

/**
 * Convert Node to frontmatter format
 */
export function nodeToFrontmatter(node: Node): NodeFrontmatter {
  const frontmatter: NodeFrontmatter = {
    uuid: node.uuid,
    type: node.type,
    title: node.title,
    created: node.metadata.created.toISOString(),
    modified: node.metadata.modified.toISOString(),
    version: node.metadata.version,
    status: node.metadata.status,
    public: node.access.tier === 'public',
    access_tier: node.access.tier,
  };

  // Add optional fields only if they have values
  if (node.metadata.confidence !== undefined) {
    frontmatter.confidence = node.metadata.confidence;
  }

  if (node.metadata.domain) {
    frontmatter.domain = node.metadata.domain;
  }

  if (node.metadata.tags && node.metadata.tags.length > 0) {
    frontmatter.tags = node.metadata.tags;
  }

  // Add relationships if any exist
  const hasRelationships =
    node.relationships.depends_on?.length ||
    node.relationships.supports?.length ||
    node.relationships.contradicts?.length ||
    node.relationships.part_of ||
    node.relationships.references?.length;

  if (hasRelationships) {
    frontmatter.relationships = {};

    if (node.relationships.depends_on?.length) {
      frontmatter.relationships.depends_on = node.relationships.depends_on;
    }
    if (node.relationships.supports?.length) {
      frontmatter.relationships.supports = node.relationships.supports;
    }
    if (node.relationships.contradicts?.length) {
      frontmatter.relationships.contradicts = node.relationships.contradicts;
    }
    if (node.relationships.part_of) {
      frontmatter.relationships.part_of = node.relationships.part_of;
    }
    if (node.relationships.references?.length) {
      frontmatter.relationships.references = node.relationships.references;
    }
  }

  // Add logic blocks if any exist
  if (node.logic && node.logic.length > 0) {
    frontmatter.logic = node.logic.map((block): SerializedLogicBlock => ({
      trigger: block.trigger,
      conditions: block.conditions.length > 0
        ? block.conditions.map((c) => ({
            type: c.type,
            params: c.params as Record<string, unknown>,
          }))
        : undefined,
      actions: block.actions.map((a) => ({
        type: a.type,
        params: a.params as Record<string, unknown>,
      })),
    }));
  }

  return frontmatter;
}

/**
 * Convert frontmatter to Node
 */
export function frontmatterToNode(fm: NodeFrontmatter, content: string): Node {
  return {
    uuid: fm.uuid,
    type: fm.type,
    title: fm.title ?? extractTitleFromContent(content),
    content,
    metadata: {
      created: new Date(fm.created),
      modified: new Date(fm.modified),
      version: fm.version,
      confidence: fm.confidence,
      status: fm.status,
      domain: fm.domain,
      tags: fm.tags ?? [],
    },
    relationships: {
      depends_on: fm.relationships?.depends_on ?? [],
      supports: fm.relationships?.supports ?? [],
      contradicts: fm.relationships?.contradicts ?? [],
      part_of: fm.relationships?.part_of,
      references: fm.relationships?.references ?? [],
      children: [],
    },
    access: {
      owner: 'local',
      tier: fm.access_tier,
      encryption: 'none',
      allowed_consumers: [],
      denied_consumers: [],
    },
    logic: fm.logic?.map((block, index) => ({
      id: `logic-${index}`,
      trigger: block.trigger,
      conditions: block.conditions?.map((c) => ({
        type: c.type as ConditionType,
        params: c.params,
      })) ?? [],
      actions: block.actions.map((a) => ({
        type: a.type as ActionType,
        params: a.params,
      })),
      enabled: true,
    })) ?? [],
  };
}

/**
 * Validate and normalize parsed frontmatter
 */
function validateAndNormalizeFrontmatter(
  parsed: Partial<NodeFrontmatter>,
  filePath: string
): NodeFrontmatter {
  const now = new Date().toISOString();
  const filename = filePath.split('/').pop()?.replace('.md', '') ?? 'Untitled';

  return {
    uuid: parsed.uuid ?? uuidv4(),
    type: validateNodeType(parsed.type) ?? 'note',
    title: parsed.title ?? filename,
    created: parsed.created ?? now,
    modified: parsed.modified ?? now,
    version: parsed.version ?? '1.0.0',
    confidence: parsed.confidence,
    status: validateStatus(parsed.status) ?? 'draft',
    domain: validateDomain(parsed.domain),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    public: parsed.public ?? false,
    access_tier: validateAccessTier(parsed.access_tier) ?? 'owner',
    relationships: parsed.relationships,
    logic: parsed.logic,
  };
}

/**
 * Create default frontmatter for a new file
 */
function createDefaultFrontmatter(filePath: string): NodeFrontmatter {
  const now = new Date().toISOString();
  const filename = filePath.split('/').pop()?.replace('.md', '') ?? 'Untitled';

  return {
    uuid: uuidv4(),
    type: 'note',
    title: filename,
    created: now,
    modified: now,
    version: '1.0.0',
    status: 'draft',
    public: false,
    access_tier: 'owner',
    tags: [],
  };
}

/**
 * Extract title from markdown content (first heading or first line)
 */
function extractTitleFromContent(content: string): string {
  // Try to find first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Use first non-empty line
  const firstLine = content.split('\n').find((line) => line.trim().length > 0);
  return firstLine?.slice(0, 50).trim() ?? 'Untitled';
}

// Validation helpers
function validateNodeType(type: unknown): NodeType | undefined {
  const validTypes: NodeType[] = [
    'text', 'heading', 'database', 'formula', 'logic', 'embed',
    'axiom', 'theorem', 'claim', 'evidence', 'paper', 'note',
  ];
  return validTypes.includes(type as NodeType) ? (type as NodeType) : undefined;
}

function validateStatus(status: unknown): NodeStatus | undefined {
  const validStatuses: NodeStatus[] = ['draft', 'review', 'canonical'];
  return validStatuses.includes(status as NodeStatus) ? (status as NodeStatus) : undefined;
}

function validateAccessTier(tier: unknown): AccessTier | undefined {
  const validTiers: AccessTier[] = ['owner', 'collaborator', 'viewer', 'public', 'ai_consumer'];
  return validTiers.includes(tier as AccessTier) ? (tier as AccessTier) : undefined;
}

function validateDomain(domain: unknown): Domain | undefined {
  const validDomains: Domain[] = ['physics', 'theology', 'consciousness', 'methodology', 'general'];
  return validDomains.includes(domain as Domain) ? (domain as Domain) : undefined;
}

/**
 * Update the modified date in frontmatter
 */
export function updateModifiedDate(frontmatter: NodeFrontmatter): NodeFrontmatter {
  return {
    ...frontmatter,
    modified: new Date().toISOString(),
  };
}

/**
 * Increment version number
 */
export function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  if (parts.length === 3) {
    parts[2] += 1; // Increment patch version
    return parts.join('.');
  }
  return '1.0.1';
}
