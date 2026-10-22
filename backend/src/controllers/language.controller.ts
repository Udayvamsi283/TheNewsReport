import { Request, Response, NextFunction } from 'express';
import { Language } from '../models/language.model.js';
import { createLanguageSchema, updateLanguageSchema } from '../validators/language.validator.js';

export const listLanguages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string;
    const query: Record<string, any> = {};

    if (status && ['active', 'inactive'].includes(status)) {
      query.status = status;
    }

    const languages = await Language.find(query).sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      data: { languages }
    });
  } catch (error) {
    next(error);
  }
};

export const createLanguage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createLanguageSchema.parse(req.body);

    const existing = await Language.findOne({ code: validatedData.code });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Language with code "${validatedData.code}" already exists.`
      });
      return;
    }

    // If setting as default, clear other default
    if (validatedData.isDefault) {
      await Language.updateMany({}, { $set: { isDefault: false } });
    }

    const language = await Language.create({
      name: validatedData.name,
      code: validatedData.code,
      isDefault: validatedData.isDefault || false,
      status: validatedData.status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Language added successfully.',
      data: { language }
    });
  } catch (error) {
    next(error);
  }
};

export const updateLanguage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = updateLanguageSchema.parse(req.body);
    const language = await Language.findById(req.params.id);

    if (!language) {
      res.status(404).json({ success: false, message: 'Language not found.' });
      return;
    }

    if (validatedData.isDefault) {
      await Language.updateMany({ _id: { $ne: language._id } }, { $set: { isDefault: false } });
      language.isDefault = true;
    } else if (validatedData.isDefault === false && language.isDefault) {
      // Must have at least one default language
      res.status(400).json({
        success: false,
        message: 'Cannot unset default language without assigning another default.'
      });
      return;
    }

    if (validatedData.name) language.name = validatedData.name;
    if (validatedData.code) language.code = validatedData.code;
    if (validatedData.status) language.status = validatedData.status;

    await language.save();

    res.status(200).json({
      success: true,
      message: 'Language updated successfully.',
      data: { language }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLanguage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const language = await Language.findById(req.params.id);
    if (!language) {
      res.status(404).json({ success: false, message: 'Language not found.' });
      return;
    }

    if (language.isDefault) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete the default platform language.'
      });
      return;
    }

    await Language.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Language deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
