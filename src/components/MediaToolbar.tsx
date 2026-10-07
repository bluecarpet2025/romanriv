"use client";

import { useId } from "react";
import type { MediaSort } from "@/lib/media-browsing";
import styles from "./MediaToolbar.module.css";

type Option = { value: string; label: string };
type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sort: MediaSort;
  onSortChange: (value: MediaSort) => void;
  sortOptions: { value: MediaSort; label: string }[];
  visibleCount: number;
  totalCount: number;
  noun: string;
  onReset: () => void;
  filter?: { label: string; value: string; options: readonly Option[]; onChange: (value: string) => void; disabled?: boolean };
  favorites?: { value: boolean; onChange: (value: boolean) => void };
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  loading?: boolean;
};

export default function MediaToolbar(props: Props) {
  const id = useId();
  return (
    <div className={styles.toolbar} role="region" aria-label="Media browsing controls">
      <label className={styles.search} htmlFor={`${id}-search`}>Search
        <input id={`${id}-search`} type="search" value={props.search} placeholder={props.searchPlaceholder}
          onChange={(event) => props.onSearchChange(event.target.value)} />
      </label>
      <label htmlFor={`${id}-sort`}>Sort
        <select id={`${id}-sort`} value={props.sort} onChange={(event) => props.onSortChange(event.target.value as MediaSort)}>
          {props.sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {props.filter ? (
        <label htmlFor={`${id}-filter`}>{props.filter.label}
          <select id={`${id}-filter`} value={props.filter.value} disabled={props.filter.disabled}
            onChange={(event) => props.filter?.onChange(event.target.value)}>
            {props.filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ) : null}
      {props.favorites ? (
        <label className={styles.check}>
          <input type="checkbox" checked={props.favorites.value} onChange={(event) => props.favorites?.onChange(event.target.checked)} />
          Favorites only
        </label>
      ) : null}
      <div className={styles.actions}>
        <button type="button" onClick={props.onReset}>Reset</button>
        {props.onRefresh ? <button type="button" disabled={props.refreshDisabled} onClick={props.onRefresh}>Refresh</button> : null}
      </div>
      <span className={styles.count} role="status" aria-live="polite">
        {props.loading ? "Loading…" : `${props.visibleCount} of ${props.totalCount} ${props.noun}`}
      </span>
    </div>
  );
}
