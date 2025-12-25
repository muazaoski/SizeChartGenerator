import React from 'react';
import { Upload, ChevronDown, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { defaultBrands } from '../lib/brands';

export function BrandSelector({ selectedBrand, onSelect, onLogoUpload }) {
    const handleLogoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onLogoUpload(reader.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="space-y-3">
            {/* Brand Select Dropdown */}
            <div className="relative">
                <select
                    value={selectedBrand?.id || ''}
                    onChange={(e) => {
                        const brand = defaultBrands.find(b => b.id === e.target.value);
                        onSelect(brand || null);
                    }}
                    className="w-full px-3 py-2.5 pr-10 border border-white/10 rounded-lg bg-slate-800/50 text-gray-100 hover:border-violet-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none text-sm cursor-pointer"
                >
                    <option value="">No logo</option>
                    {defaultBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                            {brand.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
            </div>

            {/* Selected Brand Preview */}
            {selectedBrand && selectedBrand.logo && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-white/5 rounded-xl">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1.5">
                        <img
                            src={selectedBrand.logo}
                            alt={selectedBrand.name}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate">{selectedBrand.name}</p>
                        <p className="text-xs text-gray-500">Logo active</p>
                    </div>
                    <button
                        onClick={() => onSelect(null)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                        title="Remove logo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Custom Logo Upload */}
            {selectedBrand?.id === 'custom' && (
                <div className="p-4 border border-dashed border-violet-500/30 rounded-xl bg-violet-500/5">
                    <label className="flex flex-col gap-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <Upload className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-white">Upload Logo</span>
                                <p className="text-xs text-gray-500">PNG or SVG recommended</p>
                            </div>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                </div>
            )}
        </div>
    );
}
