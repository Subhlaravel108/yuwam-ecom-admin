import React, { useRef } from "react";
import { uploadTourImage } from "@/lib/api";

type ImageUploaderProps = {
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, value, onChange, multiple }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (multiple) {
      const arr = await Promise.all(Array.from(files).map(uploadTourImage));
      onChange([...(Array.isArray(value) ? value : []), ...arr]);
    } else {
      const imgUrl = await uploadTourImage(files[0]);
      console.log("imgUrl", imgUrl);
      onChange(imgUrl);
    }
  };

  const handleRemove = (idx: number) => {
    if (Array.isArray(value)) {
      onChange(value.filter((_, i) => i !== idx));
    }
  };

  return (
    <div>
      <label className="font-medium">{label}</label>
      <div className="flex gap-2 mt-1 overflow-x-auto pb-2" style={{ maxWidth: 600 }}>
        {Array.isArray(value)
          ? value.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                <img src={img} alt="" className="w-24 h-24 object-cover rounded" />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  onClick={() => handleRemove(idx)}
                >
                  ×
                </button>
              </div>
            ))
          : value && (
              <img src={value} alt="" className="w-24 h-24 object-cover rounded" />
            )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-blue-400 flex-shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          +
        </button>
      </div>
    </div>
  );
};