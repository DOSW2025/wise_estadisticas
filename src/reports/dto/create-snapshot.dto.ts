export class CreateSnapshotDto {
  type: string;
  name?: string;
  description?: string;
  data: any;
  createdBy?: string;
}
