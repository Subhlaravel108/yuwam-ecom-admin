import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { fetchDestinations } from "@/lib/api";

interface Destination {
  id: number;
  title: string;
  // other fields if any
}

interface DestinationSelectProps {
  value?: Destination | null;
  onChange: (destination: Destination) => void;
}

const DestinationSelect: React.FC<DestinationSelectProps> = ({ value, onChange }) => {
  const [search, setSearch] = useState(value ? value.title : "");
  const [options, setOptions] = useState<Destination[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (search.trim() === "") {
        setOptions([]);
        return;
      }
      try {
        const response = await fetchDestinations({ page: 1, title: search });
        // Adjust based on how your API returns data (assumed response.data.data)
        setOptions(response.data.data || []);
      } catch (error) {
        console.error("Error fetching destinations", error);
      }
    };
    fetchOptions();
  }, [search]);

  return (
    <div className="relative">
      <Input
        placeholder="Search destinations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded p-2 w-full"
      />
      {search && options.length > 0 && search !== value?.title && (
        <ul className="absolute left-0 top-full mt-1 z-20 bg-white border rounded w-full max-h-60 overflow-y-auto shadow-sm">
          {options.map((dest) => (
            <li
              key={dest.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(dest);
                setSearch(dest.title);
                setOptions([]);
              }}
            >
              {dest.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DestinationSelect;