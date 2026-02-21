import { defineType } from "sanity";

/**
 * Reusable locale string type for multilingual text fields
 * Usage: { name: 'title', type: 'localeString' }
 */
export const localeString = defineType({
  name: "localeString",
  title: "Localized String",
  type: "object",
  fields: [
    {
      name: "de",
      title: "Deutsch",
      type: "string",
    },
    {
      name: "en",
      title: "English",
      type: "string",
    },
    {
      name: "ru",
      title: "Русский",
      type: "string",
    },
  ],
});

/**
 * Reusable locale text type for multilingual rich text fields
 * Usage: { name: 'body', type: 'localeText' }
 */
export const localeText = defineType({
  name: "localeText",
  title: "Localized Text",
  type: "object",
  fields: [
    {
      name: "de",
      title: "Deutsch",
      type: "text",
    },
    {
      name: "en",
      title: "English",
      type: "text",
    },
    {
      name: "ru",
      title: "Русский",
      type: "text",
    },
  ],
});

/**
 * Reusable locale rich text (Portable Text) for multilingual content
 * Usage: { name: 'content', type: 'localeRichText' }
 */
export const localeRichText = defineType({
  name: "localeRichText",
  title: "Localized Rich Text",
  type: "object",
  fields: [
    {
      name: "de",
      title: "Deutsch",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    },
    {
      name: "en",
      title: "English",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    },
    {
      name: "ru",
      title: "Русский",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    },
  ],
});
