import React from "react";
import { data } from "./data";

// Types
export interface Hobby {
  name: string;
  items?: Hobby[];
}

// Predefined pleasant colors that will be repeated or used as a base for generated colors
const baseColors = [
  "#FFD5D5", // Pastel pink
  "#D5FFD5", // Pastel green
  "#D5D5FF", // Pastel blue
  "#FFD5FF", // Pastel purple
  "#FFFFC4", // Pastel yellow
  "#FFD5C4", // Pastel peach
  "#C4FFD5", // Pastel mint
  "#D5FFFF", // Pastel cyan
  "#FFC4C4", // Pastel salmon
  "#D5C4FF", // Pastel lavender
];

// Generate a similar color to the base colors
const generateSimilarColor = (index: number) => {
  const baseColor = baseColors[index % baseColors.length];
  // Convert hex to RGB
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);

  // Add some random variation while keeping the color similar
  const variation = () => Math.floor(Math.random() * 30) - 15;
  const clamp = (n: number) => Math.min(255, Math.max(0, n));

  const newR = clamp(r + variation());
  const newG = clamp(g + variation());
  const newB = clamp(b + variation());

  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

// Create a Map to store category colors as they're assigned
const categoryColorsMap = new Map<string, string>();

// Function to get or generate color for a category
const getCategoryColor = (categoryName: string, index: number): string => {
  if (!categoryColorsMap.has(categoryName)) {
    const color =
      index < baseColors.length
        ? baseColors[index]
        : generateSimilarColor(index);
    categoryColorsMap.set(categoryName, color);
  }
  return categoryColorsMap.get(categoryName) || "#FFFFFF";
};

// Initialize category colors based on data order
const initializeCategoryColors = () => {
  data.forEach((hobby, index) => {
    getCategoryColor(hobby.name, index);
  });
};

// Initialize colors immediately
initializeCategoryColors();

// Reusable Components
const HobbyItem = ({
  hobby,
  isSelected,
  onToggle,
}: {
  hobby: string;
  isSelected: boolean;
  onToggle: () => void;
  backgroundColor?: string;
}) => (
  <div
    className="p-2 hover:bg-opacity-80 cursor-pointer flex items-center"
    onClick={onToggle}
  >
    <input type="checkbox" checked={isSelected} readOnly className="mr-2" />
    {hobby}
  </div>
);

const SelectedHobbyTag = ({
  hobby,
  onRemove,
  backgroundColor,
}: {
  hobby: string;
  onRemove: () => void;
  backgroundColor: string;
}) => (
  <div
    key={`selected-${hobby}`}
    className="flex items-center px-3 py-1 rounded-full text-sm"
    style={{ backgroundColor }}
  >
    {hobby}
    <button onClick={onRemove} className="ml-2 hover:opacity-70">
      ×
    </button>
  </div>
);

// Main Component
export default function Hobbies() {
  // State
  const [selectedHobbies, setSelectedHobbies] = React.useState<string[]>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem("selectedHobbies");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredHobbies, setFilteredHobbies] = React.useState<string[]>([]);
  const [expandedSections, setExpandedSections] = React.useState<{
    [key: string]: number;
  }>({});

  // Save to localStorage whenever selectedHobbies changes
  React.useEffect(() => {
    localStorage.setItem("selectedHobbies", JSON.stringify(selectedHobbies));
  }, [selectedHobbies]);

  // Get color for a hobby based on its top-level category
  const getHobbyColor = React.useCallback((hobbyName: string) => {
    // Find the top-level category this hobby belongs to
    const findCategory = (hobbies: Hobby[], target: string): string | null => {
      for (const hobby of hobbies) {
        if (hobby.name === target) return hobby.name;
        if (hobby.items) {
          const found = findCategory(hobby.items, target);
          if (found) return hobby.name;
        }
      }
      return null;
    };

    const category = findCategory(data, hobbyName);
    return category ? categoryColorsMap.get(category) || "#FFFFFF" : "#FFFFFF";
  }, []);

  // Utility Functions
  const getAllHobbies = React.useCallback((hobbies: Hobby[]): string[] => {
    return hobbies.reduce((acc: string[], hobby: Hobby) => {
      acc.push(hobby.name);
      if (hobby.items) {
        acc.push(...getAllHobbies(hobby.items));
      }
      return acc;
    }, []);
  }, []);

  const getAllHobbiesInOrder = React.useCallback(
    (hobbies: Hobby[]): string[] => {
      const result: string[] = [];

      const traverse = (hobby: Hobby) => {
        result.push(hobby.name);
        hobby.items?.forEach(traverse);
      };

      hobbies.forEach(traverse);
      return result;
    },
    []
  );

  // Event Handlers
  const toggleHobby = React.useCallback((hobby: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((i) => i !== hobby) : [...prev, hobby]
    );
  }, []);

  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchTerm(value);

      if (value.trim() === "") {
        setFilteredHobbies([]);
        return;
      }

      const allHobbies = getAllHobbies(data);
      const filtered = allHobbies.filter((hobby) =>
        hobby.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredHobbies(filtered);
    },
    [getAllHobbies]
  );

  const showMore = React.useCallback((hobbyPath: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [hobbyPath]: (prev[hobbyPath] || 5) + 5,
    }));
  }, []);

  // Helper Functions
  const getSelectedCount = React.useCallback(
    (hobby: Hobby): { selected: number; total: number } => {
      if (!hobby.items) {
        return { selected: 0, total: 0 };
      }

      return hobby.items.reduce(
        (acc, subHobby) => ({
          total: acc.total + 1,
          selected:
            acc.selected + (selectedHobbies.includes(subHobby.name) ? 1 : 0),
        }),
        { selected: 0, total: 0 }
      );
    },
    [selectedHobbies]
  );

  const renderHobbiesAndItems = React.useCallback(
    (hobbies: Hobby[], parentPath: string = "") => {
      const renderHobby = (hobby: Hobby, parentPath: string = "") => {
        const counts = getSelectedCount(hobby);
        const countDisplay =
          counts.total > 0 ? ` (${counts.selected}/${counts.total})` : "";
        const currentPath = parentPath
          ? `${parentPath}-${hobby.name}`
          : hobby.name;
        const isSelected = selectedHobbies.includes(hobby.name);
        const backgroundColor = getHobbyColor(hobby.name);

        return (
          <details
            key={`${hobby.name}-${hobby}`}
            className="mb-4 mr-2 rounded-lg overflow-hidden [&>summary>svg]:open:rotate-180"
            style={{ border: `1px solid ${backgroundColor}` }}
          >
            <summary
              className="cursor-pointer px-4 py-2 flex items-center justify-between"
              style={{ backgroundColor }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={hobby.name}
                    className="mr-2"
                    checked={isSelected}
                    onChange={() => toggleHobby(hobby.name)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor={hobby.name}>{hobby.name}</label>
                </div>
                <span className="text-black opacity-50">{countDisplay}</span>
              </div>
              {hobby.items && (
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </summary>
            {hobby.items && (
              <div className="ml-4 mt-4">
                {renderItems(hobby.items, currentPath)}
              </div>
            )}
          </details>
        );
      };

      const renderItems = (hobbies: Hobby[], parentPath: string = "") => {
        const visibleCount = expandedSections[parentPath || "root"] || 5;
        const remainingCount = hobbies.length - visibleCount;

        return (
          <div>
            {hobbies
              .slice(0, visibleCount)
              .map((hobby) => renderHobby(hobby, parentPath))}

            {remainingCount > 0 && (
              <button
                onClick={() => showMore(parentPath || "root")}
                className="px-2 py-1 text-sm bg-opacity-50 hover:bg-opacity-70 hover:text-blue-500 rounded-lg ml-auto block transition-colors duration-200"
              >
                Show more ({remainingCount} remaining)
              </button>
            )}
          </div>
        );
      };

      return renderItems(hobbies, parentPath);
    },
    [
      expandedSections,
      showMore,
      selectedHobbies,
      getSelectedCount,
      toggleHobby,
      getHobbyColor,
    ]
  );

  // Memoized Values
  const orderedSelectedHobbies = React.useMemo(
    () =>
      getAllHobbiesInOrder(data).filter((hobby) =>
        selectedHobbies.includes(hobby)
      ),
    [selectedHobbies, getAllHobbiesInOrder]
  );

  // Ref for dropdown
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchTerm("");
        setFilteredHobbies([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Render
  return (
    <div className="grid grid-rows-[auto_auto_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-4 font-[family-name:var(--font-geist-sans)]">
      {/* Selected Hobbies Tags */}
      <div className="w-full max-w-md flex flex-wrap gap-2 min-h-[28px]">
        {orderedSelectedHobbies.map((hobby) => (
          <SelectedHobbyTag
            key={hobby}
            hobby={hobby}
            onRemove={() => toggleHobby(hobby)}
            backgroundColor={getHobbyColor(hobby)}
          />
        ))}
      </div>

      {/* Search Input */}
      <div className="w-full max-w-md relative" ref={dropdownRef}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search hobbies..."
          className="w-full p-2 border rounded-lg mb-4 text-black"
        />

        {/* Search Results Dropdown */}
        {filteredHobbies.length > 0 && searchTerm && (
          <div className="absolute w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 text-black">
            {filteredHobbies.map((hobby) => (
              <HobbyItem
                key={hobby}
                hobby={hobby}
                isSelected={selectedHobbies.includes(hobby)}
                onToggle={() => toggleHobby(hobby)}
                backgroundColor={getHobbyColor(hobby)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hobbies Tree */}
      <div className="w-full max-w-md text-black">
        {renderHobbiesAndItems(data)}
      </div>
    </div>
  );
}
