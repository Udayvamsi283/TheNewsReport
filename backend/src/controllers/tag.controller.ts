import { Request, Response, NextFunction } from 'express';
import { Tag } from '../models/tag.model.js';
import { createTagSchema, updateTagSchema } from '../validators/tag.validator.js';

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const listTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = ((req.query.search || req.query.q) as string)?.trim();
    const query: Record<string, any> = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const tags = await Tag.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { tags }
    });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createTagSchema.parse(req.body);
    const slug = validatedData.slug || generateSlug(validatedData.name);

    const existing = await Tag.findOne({ $or: [{ name: validatedData.name }, { slug }] });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A tag with this name or slug already exists.'
      });
      return;
    }

    const tag = await Tag.create({
      name: validatedData.name,
      slug
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully.',
      data: { tag }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = updateTagSchema.parse(req.body);
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found.' });
      return;
    }

    if (validatedData.name) tag.name = validatedData.name;
    if (validatedData.slug) tag.slug = validatedData.slug;

    await tag.save();

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully.',
      data: { tag }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
