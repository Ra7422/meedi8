"""
Admin-only routes for monitoring costs and usage
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db
from app.models.user import User
from app.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAILS = ["adam@cleanair.com", "admin@cleanair.com"]  # Configure your admin emails

def require_admin(current_user: User = Depends(get_current_user)):
    """Verify user is an admin"""
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/costs/overview")
def get_cost_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get cost overview - ADMIN ONLY"""
    
    total_stats = db.execute(text("""
        SELECT 
            COALESCE(SUM(cost_usd), 0) as total_cost,
            COUNT(DISTINCT room_id) as rooms_with_costs,
            COUNT(*) as total_ai_calls,
            COALESCE(SUM(input_tokens), 0) as total_input,
            COALESCE(SUM(output_tokens), 0) as total_output
        FROM turns 
        WHERE cost_usd > 0
    """)).first()
    
    # Cost per completed mediation
    completed = db.execute(text("""
        SELECT 
            COUNT(DISTINCT r.id) as completed_count,
            AVG(room_cost) as avg_cost,
            MIN(room_cost) as min_cost,
            MAX(room_cost) as max_cost
        FROM (
            SELECT r.id, COALESCE(SUM(t.cost_usd), 0) as room_cost
            FROM rooms r
            LEFT JOIN turns t ON r.id = t.room_id
            WHERE r.phase = 'resolved'
            GROUP BY r.id
        ) as room_costs
        WHERE room_cost > 0
    """)).first()
    
    # Today's costs
    today_costs = db.execute(text("""
        SELECT 
            COALESCE(SUM(cost_usd), 0) as today_cost,
            COUNT(*) as today_calls
        FROM turns
        WHERE cost_usd > 0 
        AND DATE(created_at) = CURRENT_DATE
    """)).first()
    
    return {
        "total": {
            "cost_usd": float(total_stats[0]),
            "rooms": int(total_stats[1]),
            "ai_calls": int(total_stats[2]),
            "input_tokens": int(total_stats[3]),
            "output_tokens": int(total_stats[4])
        },
        "completed_mediations": {
            "count": int(completed[0]) if completed[0] else 0,
            "avg_cost": float(completed[1]) if completed[1] else 0,
            "min_cost": float(completed[2]) if completed[2] else 0,
            "max_cost": float(completed[3]) if completed[3] else 0
        },
        "today": {
            "cost_usd": float(today_costs[0]),
            "ai_calls": int(today_costs[1])
        }
    }

@router.get("/users/usage")
def get_user_usage(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get usage stats per user - ADMIN ONLY"""
    
    usage = db.execute(text("""
        SELECT 
            u.id,
            u.email,
            u.name,
            u.subscription_tier,
            COUNT(DISTINCT r.id) as total_rooms,
            COUNT(DISTINCT CASE WHEN r.phase = 'resolved' THEN r.id END) as completed_rooms,
            COALESCE(SUM(t.cost_usd), 0) as total_cost
        FROM users u
        LEFT JOIN room_participants rp ON u.id = rp.user_id
        LEFT JOIN rooms r ON rp.room_id = r.id
        LEFT JOIN turns t ON r.id = t.room_id AND t.cost_usd > 0
        GROUP BY u.id, u.email, u.name, u.subscription_tier
        HAVING COUNT(DISTINCT r.id) > 0
        ORDER BY total_cost DESC
        LIMIT 100
    """)).fetchall()
    
    return {
        "users": [
            {
                "user_id": row[0],
                "email": row[1],
                "name": row[2],
                "subscription": row[3] or "free",
                "total_rooms": int(row[4]),
                "completed_rooms": int(row[5]),
                "cost_to_us": float(row[6])
            }
            for row in usage
        ]
    }
