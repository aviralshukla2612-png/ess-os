import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  expectedColumns?: string[];
}

export function DataImportModal({ isOpen, onClose, onImport, title, expectedColumns }: DataImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setStep(1);
    setIsImporting(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFile = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    
    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setParsedData(results.data);
            setStep(2);
          },
          error: (err: any) => setError("Failed to parse CSV: " + err.message)
        });
      } else if (extension === 'xls' || extension === 'xlsx') {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(json);
        setStep(2);
      } else {
        setError("Unsupported file format. Please upload .csv, .xls, or .xlsx");
        setFile(null);
      }
    } catch (err: any) {
      setError("Error processing file: " + err.message);
      setFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      await onImport(parsedData);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to import data.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isImporting ? handleClose : undefined}
            className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] z-[101]"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Upload .csv, .xls, or .xlsx files to bulk import records.
                  </p>
                </div>
                {!isImporting && (
                  <button
                    onClick={handleClose}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start gap-3 shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-rose-800 dark:text-rose-300">{error}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto min-h-0">
                {step === 1 && (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                        : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xls, .xlsx"
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Drag & Drop your file here
                    </span>
                    <span className="text-xs text-slate-500 mt-1">or click to browse</span>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 truncate">
                          {file?.name}
                        </div>
                        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {parsedData.length} records found
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px]">
                            <tr>
                              {parsedData.length > 0 &&
                                Object.keys(parsedData[0]).map((key, i) => (
                                  <th key={i} className="px-4 py-3 whitespace-nowrap">
                                    {key}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                            {parsedData.slice(0, 5).map((row, i) => (
                              <tr key={i} className="text-slate-700 dark:text-slate-300">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={j} className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate">
                                    {val?.toString() || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedData.length > 5 && (
                        <div className="p-3 text-center text-xs font-semibold text-slate-500 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                          + {parsedData.length - 5} more records
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {step === 2 && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    onClick={resetState}
                    disabled={isImporting}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isImporting || parsedData.length === 0}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Import ({parsedData.length})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
