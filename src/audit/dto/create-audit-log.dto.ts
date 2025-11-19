export class CreateAuditLogDto {
  action: string;
  userId?: string;
  resourceType: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
}
