import { z } from "zod";
import type { Category, CategoryAttribute, CategoryNode } from "./types";

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const bySort = (a: Category, b: Category) => a.sortOrder - b.sortOrder;
  const roots = categories.filter((c) => c.parentId === null).sort(bySort);
  return roots.map((root) => ({
    ...root,
    children: categories.filter((c) => c.parentId === root.id).sort(bySort),
  }));
}

export function findCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Ancestors from the root down to (and including) the category. */
export function categoryPath(categories: Category[], category: Category): Category[] {
  const path: Category[] = [category];
  let current = category;
  const seen = new Set([category.id]);
  while (current.parentId) {
    const parent = categories.find((c) => c.id === current.parentId);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    path.unshift(parent);
    current = parent;
  }
  return path;
}

/** Ids of a category and all its descendants (used to search a parent category). */
export function descendantIds(categories: Category[], rootId: string): string[] {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of categories) if (c.parentId === ids[i] && !ids.includes(c.id)) ids.push(c.id);
  }
  return ids;
}

/**
 * Category-specific fields a listing must use: inherited from ancestors, then the
 * category's own. A child field with the same key overrides the parent's.
 */
export function effectiveAttributes(categories: Category[], category: Category): CategoryAttribute[] {
  const merged = new Map<string, CategoryAttribute>();
  for (const node of categoryPath(categories, category)) {
    for (const attr of node.attributes) merged.set(attr.key, attr);
  }
  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Builds a server-side validator for a listing's `attributes` JSON from the
 * database field definitions. Unknown keys are rejected so clients cannot store
 * arbitrary data. Used by the Phase B "Post an ad" server action.
 */
export function attributesSchema(attributes: CategoryAttribute[], now = new Date()) {
  const shape: Record<string, z.ZodType> = {};
  for (const attr of attributes) {
    let field: z.ZodType;
    switch (attr.dataType) {
      case "text":
        field = z.string().trim().min(1).max(80);
        break;
      case "integer":
      case "year": {
        let n = z.number().int();
        if (attr.min !== undefined) n = n.min(attr.min);
        const max = attr.dataType === "year" ? (attr.max ?? now.getUTCFullYear() + 1) : attr.max;
        if (max !== undefined) n = n.max(max);
        field = n;
        break;
      }
      case "decimal": {
        let n = z.number().finite();
        if (attr.min !== undefined) n = n.min(attr.min);
        if (attr.max !== undefined) n = n.max(attr.max);
        field = n;
        break;
      }
      case "boolean":
        field = z.boolean();
        break;
      case "select": {
        const values = (attr.options ?? []).map((o) => o.value);
        field = values.length > 0 ? z.enum(values as [string, ...string[]]) : z.never();
        break;
      }
    }
    shape[attr.key] = attr.required ? field : field.optional();
  }
  return z.strictObject(shape);
}
