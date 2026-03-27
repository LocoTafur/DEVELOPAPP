from pydantic import BaseModel
from typing import List


class RoleBase(BaseModel):
    name: str
    permissions: List[str]


class RoleCreate(RoleBase):
    pass


class RoleOut(RoleBase):
    id: int

    class Config:
        from_attributes = True
