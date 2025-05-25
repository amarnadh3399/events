import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange, filterCategory, onFilterChange }) => (
  <div className="search-filter">
    <input
      type="text"
      placeholder="Search events..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
    />
    <select
      value={filterCategory}
      onChange={(e) => onFilterChange(e.target.value)}
    >
      <option value="all">All Categories</option>
      <option value="work">Work</option>
      <option value="personal">Personal</option>
      <option value="holiday">Holiday</option>
    </select>
  </div>
);

export default SearchBar;