import { Schema, model } from "mongoose";

export interface IPageContent {
  slug: string;
  name: string;
  isSystem: boolean;
  published: boolean;
  sections: any[];
  updatedAt: Date;
  createdAt: Date;
}

const PageContentSchema = new Schema<IPageContent>(
  {
    slug: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    isSystem: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    sections: { type: [Schema.Types.Mixed as never], default: [] },
    updatedAt: { type: Date, default: () => new Date() },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_page_content" }
);

export const PageContent = model<IPageContent>(
  "PageContent",
  PageContentSchema
);