import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Check
} from 'lucide-react';

export const AdminBulkUploadPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [targetStatus, setTargetStatus] = useState<'draft' | 'published'>('draft');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Preview Result
  const [previewResult, setPreviewResult] = useState<{
    totalRows: number;
    validCount: number;
    errorCount: number;
    errors: { row: number; reason: string }[];
    sample: any[];
  } | null>(null);

  const [importCompleted, setImportCompleted] = useState<{
    count: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setPreviewResult(null);
      setImportCompleted(null);
    }
  };

  const handleValidate = async () => {
    if (!csvFile) {
      showToast('Please select a CSV file first', 'error');
      return;
    }

    setIsValidating(true);
    try {
      const res = await apiClient.bulkUploadPosts(csvFile, {
        action: 'preview',
        targetStatus
      });
      setPreviewResult({
        totalRows: res.totalRows,
        validCount: res.validCount,
        errorCount: res.errorCount,
        errors: res.errors || [],
        sample: res.sample || []
      });
      showToast(`Validation complete: ${res.validCount} valid entries found`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Validation failed', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    try {
      const res = await apiClient.bulkUploadPosts(csvFile, {
        action: 'import',
        targetStatus
      });
      setImportCompleted({ count: res.importedCount });
      showToast(res.message || 'Bulk import completed successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'title,summary,content,category,postFormat\n' +
      '"Global Climate Summit Reaches Accord","World leaders agree on new targets","Detailed article body text here...","World","article"\n' +
      '"Top 10 Breakthrough Energy Innovations","Ranked renewable technologies of 2026","Detailed countdown analysis...","Technology","sorted_list"\n' +
      '"Historic Photo Dispatch From The Arctic","Field images of shifting ice shelves","High-resolution essay...","Environment","gallery"';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'the_news_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-navy-750">
        <Link to="/admin/posts">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dispatches
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Bulk CSV Dispatch Ingestion
          </h1>
          <p className="text-xs text-slate-500">
            Import multiple articles with automated slug generation, category resolution, and safety validation.
          </p>
        </div>
      </div>

      {/* Step 1: Upload Card */}
      <Card className="p-6 space-y-5 bg-white dark:bg-navy-850">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              1. Select CSV Data File
            </h3>
            <p className="text-xs text-slate-500">
              CSV must include headers: title, summary, content, category, postFormat
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={downloadSampleCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download Sample CSV
          </Button>
        </div>

        <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-8 text-center space-y-2">
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <label className="cursor-pointer text-xs font-bold text-editorial-red hover:underline">
              Choose CSV file from workstation
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">UTF-8 encoded comma-separated file</p>
          </div>
          {csvFile && (
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-2 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                Selected: {csvFile.name} ({Math.round(csvFile.size / 1024)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Target Status Choice */}
        <div className="flex items-center gap-4 pt-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Import Target Status:
          </span>
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              name="targetStatus"
              value="draft"
              checked={targetStatus === 'draft'}
              onChange={() => setTargetStatus('draft')}
              className="text-editorial-red focus:ring-editorial-red"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Save as Drafts (Recommended)
            </span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="radio"
              name="targetStatus"
              value="published"
              checked={targetStatus === 'published'}
              onChange={() => setTargetStatus('published')}
              className="text-editorial-red focus:ring-editorial-red"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Publish Immediately
            </span>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={handleValidate}
            isLoading={isValidating}
            disabled={!csvFile || isValidating}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Validate & Preview CSV
          </Button>
        </div>
      </Card>

      {/* Step 2: Validation Preview */}
      {previewResult && !importCompleted && (
        <Card className="p-6 space-y-4 bg-white dark:bg-navy-850">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-navy-750">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                2. Validation Results & Sample Preview
              </h3>
              <p className="text-xs text-slate-500">
                Review verified rows before writing to the database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                {previewResult.validCount} Valid
              </Badge>
              {previewResult.errorCount > 0 && (
                <Badge variant="danger" size="sm">
                  {previewResult.errorCount} Errors
                </Badge>
              )}
            </div>
          </div>

          {/* Error messages list */}
          {previewResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Rows requiring attention:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {previewResult.errors.map((err, i) => (
                  <li key={i}>
                    Row {err.row}: {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sample Table */}
          {previewResult.sample.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 dark:border-navy-750 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Headline</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewResult.sample.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-xs">{item.title}</TableCell>
                      <TableCell className="text-xs text-slate-500 truncate max-w-xs">
                        {item.summary || 'None'}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-mono">{item.postFormat}</TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm" className="capitalize">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-navy-750">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCsvFile(null);
                setPreviewResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              isLoading={isImporting}
              disabled={previewResult.validCount === 0 || isImporting}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Confirm & Import {previewResult.validCount} Post(s)
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Success Confirmation */}
      {importCompleted && (
        <Card className="p-8 text-center space-y-4 bg-white dark:bg-navy-850">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Import Completed Successfully!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Created {importCompleted.count} new dispatch record(s) in your CMS database.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCsvFile(null);
                setPreviewResult(null);
                setImportCompleted(null);
              }}
            >
              Import Another File
            </Button>
            <Button size="sm" onClick={() => navigate('/admin/posts')}>
              View All Dispatches
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
