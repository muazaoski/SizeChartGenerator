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
                    className="w-full px-4 py-3.5 pr-10 border border-white/10 rounded-2xl bg-white/[0.03] text-gray-100 hover:border-yellow-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/30 appearance-none text-sm cursor-pointer font-bold uppercase tracking-wider"
                >
                    <option value="">No logo</option>
                    {defaultBrands.map((brand) => (
                        <option key={brand.id} value={brand.id} className="bg-neutral-900">
                            {brand.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-yellow-500" />
                </div>
            </div>

            {/* Selected Brand Preview */}
            {selectedBrand && selectedBrand.logo && (
                <div className="flex items-center gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-2xl shadow-xl">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 shadow-lg">
                        <img
                            src={selectedBrand.logo}
                            alt={selectedBrand.name}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-xs uppercase tracking-widest text-white truncate">{selectedBrand.name}</p>
                        <p className="text-[10px] text-yellow-500 font-bold uppercase mt-0.5">Vector Active</p>
                    </div>
                    <button
                        onClick={() => onSelect(null)}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                        title="Remove logo"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Custom Logo Upload */}
            {selectedBrand?.id === 'custom' && (
                <div className="p-5 border border-dashed border-yellow-500/30 rounded-2xl bg-yellow-500/5 group hover:bg-yellow-500/10 transition-all">
                    <label className="flex flex-col gap-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <span className="text-xs font-black text-white uppercase tracking-widest leading-none">Import Brand</span>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">PNG • SVG • WEBP</p>
                            </div>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                </div>
            )}
        </div>
    );
}
