import ProjectListItem from "./ProjectListItem";

export default function ProjectList({ projects = [], activeProjectId, onSelect, onRename, onDelete }) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return (
      <p className="px-2 py-2 text-[13px] text-ink-soft">No projects yet</p>
    );
  }

  return (
    <ul className="project-list">
      {projects.map((project, index) => (
        <ProjectListItem
          key={project.project_id ?? index}
          project={project}
          isActive={project.project_id === activeProjectId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}