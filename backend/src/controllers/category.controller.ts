import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/category.model.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const listCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string;
    const query: Record<string, any> = {};

    if (status && ['active', 'inactive'].includes(status)) {
      query.status = status;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug');
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    const slug = validatedData.slug || generateSlug(validatedData.name);

    // Check slug uniqueness
    const existing = await Category.findOne({ slug });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Category with slug "${slug}" already exists.`
      });
      return;
    }

    // Verify parent exists if provided
    if (validatedData.parent) {
      const parentExists = await Category.findById(validatedData.parent);
      if (!parentExists) {
        res.status(400).json({
          success: false,
          message: 'Specified parent category does not exist.'
        });
        return;
      }
    }

    const category = await Category.create({
      name: validatedData.name,
      slug,
      description: validatedData.description || '',
      image: validatedData.image || '',
      parent: validatedData.parent || null,
      status: validatedData.status || 'active'
    });

    const populated = await Category.findById(category._id).populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: { category: populated }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = updateCategorySchema.parse(req.body);
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    // Prevent self-parenting
    if (validatedData.parent && validatedData.parent === req.params.id) {
      res.status(400).json({
        success: false,
        message: 'A category cannot be its own parent.'
      });
      return;
    }

    // Slug check if changed
    if (validatedData.slug && validatedData.slug !== category.slug) {
      const existing = await Category.findOne({ slug: validatedData.slug });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Category with slug "${validatedData.slug}" already exists.`
        });
        return;
      }
      category.slug = validatedData.slug;
    }

    if (validatedData.name) category.name = validatedData.name;
    if (validatedData.description !== undefined) category.description = validatedData.description;
    if (validatedData.image !== undefined) category.image = validatedData.image;
    if (validatedData.parent !== undefined) {
      category.parent = (validatedData.parent as any) || null;
    }
    if (validatedData.status) category.status = validatedData.status;

    await category.save();

    const updated = await Category.findById(category._id).populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: { category: updated }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    // Reassign child categories to null parent so they don't break
    await Category.updateMany({ parent: category._id }, { $set: { parent: null } });

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
