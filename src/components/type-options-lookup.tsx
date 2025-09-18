import { useCallback, useMemo } from "react";

type TypeOption = {
  label: string;
  value: string;
  description: string;
};

type ActionEntry = {
  action: string;
  platform: string;
  type_options: Array<TypeOption>;
};

export function useTypeOptionsLookup(data: Array<ActionEntry>) {
  // Build a Map keyed by `${action}::${platform}` for O(1) lookup
  const map = useMemo(() => {
    const m = new Map<string, Array<TypeOption>>();
    for (const e of data) {
      m.set(`${e.action}::${e.platform}`, e.type_options);
    }
    return m;
  }, [data]);

  // lookup returns undefined when not found, or an empty array if preferred
  const lookup = useCallback(
    (action: string, platform: string): Array<TypeOption> | undefined => {
      return map.get(`${action}::${platform}`);
    },
    [map]
  );

  return { lookup };
}
