import mongoose from 'mongoose';

const documentTemplateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['COVER', 'TERMS', 'HEADER', 'FOOTER'],
      required: true,
    },
    content: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DocumentTemplate = mongoose.model('DocumentTemplate', documentTemplateSchema);

export default DocumentTemplate;
