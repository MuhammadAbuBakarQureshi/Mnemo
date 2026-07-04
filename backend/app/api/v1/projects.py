from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from backend.app.core.database import db_session_maker

from backend.app.models.models import User, Project
from backend.app.schemas.project import ProjectCreate, ProjectUpdate, Auth

from backend.app.dependencies.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_projects(user: User = Depends(get_current_user), session: AsyncSession = Depends(db_session_maker)):

    try:
        
        result = await session.execute(select(Project).where(Project.user_id == user.user_id))
        
        projects = result.scalars().all()

        project_data = []

        for project in projects:

            project_data.append({k: v for k, v in project.__dict__.items() if not k.startswith("_sa_instance_state")})

        return project_data

    except Exception as e:

        print(f"Get Projects Error: {e}")

@router.post("/")
async def set_projects(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_session_maker)
):

    try:
        new_project = Project(
            name=project_data.name,
            description=project_data.description,
            user_id=current_user.user_id
        )

        session.add(new_project)
        await session.commit()
        await session.refresh(new_project)

        return new_project

    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while creating the project")
    

@router.patch("/{projectId}")
async def patch_project(
    projectId: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_session_maker)
):

    try:
        response = await session.execute(
            select(Project).where(Project.project_id == projectId)
        )

        project = response.scalar_one_or_none()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to modify this project")

        project.name = project_data.name

        await session.commit()
        await session.refresh(project)

        return project

    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        print(f"Projects PATCH: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while updating the project")
    

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_session_maker)
):

    try:
        project = await session.get(Project, project_id)

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.user_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this project")

        await session.delete(project)
        await session.commit()

        return {"message": "Project deleted"}

    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        print(f"Projects DELETE: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while deleting the project")