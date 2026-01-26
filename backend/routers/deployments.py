"""
Deployment API Endpoints
Handles CRUD operations for agent deployments
"""
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
from services.deployment import DeploymentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["deployments"])

deployment_service = DeploymentService()

# Request/Response Models
class WebDeploymentRequest(BaseModel):
    name: str = Field(..., description="Deployment name")
    widget_settings: Optional[Dict[str, Any]] = Field(None, description="Widget customization")
    allowed_domains: Optional[List[str]] = Field(None, description="Domain whitelist")

class PhoneDeploymentRequest(BaseModel):
    name: str = Field(..., description="Deployment name")
    area_code: Optional[str] = Field(None, description="Phone number area code")
    phone_settings: Optional[Dict[str, Any]] = Field(None, description="Phone configuration")

class APIDeploymentRequest(BaseModel):
    name: str = Field(..., description="Deployment name")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for events")
    rate_limit: int = Field(60, description="Rate limit per minute")

class DeploymentUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|paused|deleted)$")
    widget_settings: Optional[Dict[str, Any]] = None
    allowed_domains: Optional[List[str]] = None
    phone_settings: Optional[Dict[str, Any]] = None
    webhook_url: Optional[str] = None
    rate_limit: Optional[int] = None

@router.post("/agents/{agent_id}/deployments/web")
async def create_web_deployment(
    agent_id: str,
    request: WebDeploymentRequest
):
    """Create a web widget deployment"""
    try:
        result = deployment_service.create_web_deployment(
            agent_id=agent_id,
            name=request.name,
            widget_settings=request.widget_settings,
            allowed_domains=request.allowed_domains
        )
        
        if result.get("success"):
            return {
                "success": True,
                "deployment": result["deployment"],
                "embed_code": result["embed_code"]
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create deployment"))
    except Exception as e:
        logger.error(f"Error creating web deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agents/{agent_id}/deployments/phone")
async def create_phone_deployment(
    agent_id: str,
    request: PhoneDeploymentRequest
):
    """Create a phone deployment"""
    try:
        result = deployment_service.create_phone_deployment(
            agent_id=agent_id,
            name=request.name,
            area_code=request.area_code,
            phone_settings=request.phone_settings
        )
        
        if result.get("success"):
            return {
                "success": True,
                "deployment": result["deployment"],
                "phone_number": result.get("phone_number")
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create deployment"))
    except Exception as e:
        logger.error(f"Error creating phone deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/agents/{agent_id}/deployments/api")
async def create_api_deployment(
    agent_id: str,
    request: APIDeploymentRequest
):
    """Create an API deployment"""
    try:
        result = deployment_service.create_api_deployment(
            agent_id=agent_id,
            name=request.name,
            webhook_url=request.webhook_url,
            rate_limit=request.rate_limit
        )
        
        if result.get("success"):
            return {
                "success": True,
                "deployment": result["deployment"],
                "api_key": result["api_key"],
                "api_secret": result.get("api_secret")  # Show only once!
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to create deployment"))
    except Exception as e:
        logger.error(f"Error creating API deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agents/{agent_id}/deployments")
async def list_deployments(agent_id: str):
    """List all deployments for an agent"""
    try:
        deployments = deployment_service.list_deployments(agent_id)
        return {
            "success": True,
            "deployments": deployments,
            "count": len(deployments)
        }
    except Exception as e:
        logger.error(f"Error listing deployments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deployments/{deployment_id}")
async def get_deployment(deployment_id: str):
    """Get a specific deployment"""
    try:
        # This would need a new method in DeploymentService
        # For now, use list and filter
        raise HTTPException(status_code=501, detail="Not implemented yet")
    except Exception as e:
        logger.error(f"Error getting deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/deployments/{deployment_id}")
async def update_deployment(
    deployment_id: str,
    request: DeploymentUpdateRequest
):
    """Update deployment settings"""
    try:
        updates = request.model_dump(exclude_unset=True)
        result = deployment_service.update_deployment(deployment_id, updates)
        
        if result.get("success"):
            return {
                "success": True,
                "deployment": result["deployment"]
            }
        else:
            raise HTTPException(status_code=404, detail=result.get("error", "Deployment not found"))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/deployments/{deployment_id}")
async def delete_deployment(deployment_id: str):
    """Delete a deployment (soft delete)"""
    try:
        success = deployment_service.delete_deployment(deployment_id)
        if success:
            return {"success": True, "message": "Deployment deleted"}
        else:
            raise HTTPException(status_code=404, detail="Deployment not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deployments/{deployment_id}/stats")
async def get_deployment_stats(deployment_id: str):
    """Get usage statistics for a deployment"""
    try:
        result = deployment_service.get_deployment_stats(deployment_id)
        if result.get("success"):
            return {
                "success": True,
                "stats": result["stats"]
            }
        else:
            raise HTTPException(status_code=404, detail=result.get("error", "Deployment not found"))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting deployment stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deployments/{deployment_id}/embed")
async def get_embed_code(deployment_id: str):
    """Get embed code for a web deployment"""
    try:
        # Get deployment to get widget settings
        deployments = deployment_service.list_deployments("")  # Would need agent_id
        # For now, return a generic embed code
        import json
        from services.deployment import DeploymentService
        service = DeploymentService()
        embed_code = service.generate_embed_code(deployment_id, {
            "position": "bottom-right",
            "theme": "dark",
            "greeting": "Hi! How can I help you today?"
        })
        return {
            "success": True,
            "embed_code": embed_code
        }
    except Exception as e:
        logger.error(f"Error getting embed code: {e}")
        raise HTTPException(status_code=500, detail=str(e))
