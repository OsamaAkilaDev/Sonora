import React from "react";

function TabBar({ categories, selectedCategory, setSelectedCategory }) {
  return (
    <>
      {/* Tab Bar */}
      <nav className="flex h-8 w-full gap-2 rounded-sm">
        {categories.map(Tab)}
      </nav>

      {/* Divider */}
      <div className="flex w-full justify-center">
        <div className="bg-shade-700 my-2 h-[1.5px] w-full rounded-2xl"></div>
      </div>
    </>
  );

  function Tab(category, index) {
    let isActive = selectedCategory === index;
    let growStyle = isActive && "grow";
    return (
      <button
        key={index}
        onClick={() => setSelectedCategory(index)}
        className={`btn ${growStyle} cursor-pointer flex-all-center gap-2 rounded-sm p-1.5 transition-all duration-300`}
      >
        <div className="text-shade-600 h-5 w-5">{category.icon()}</div>

        {isActive && (
          <p className="text-shade-600 text-sm font-[470]">{category.name}</p>
        )}
      </button>
    );
  }
}

export default TabBar;
