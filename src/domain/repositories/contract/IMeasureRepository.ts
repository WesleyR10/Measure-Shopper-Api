import { Measure } from "../../entities/measure";

export interface IMeasureRepository {
  create(data: Measure): Promise<void>;
  findById(id: string): Promise<Measure | null>;
  findByMeasureId(measure_uuid: string): Promise<Measure | null>;
  update(id: string, data: Partial<Measure>): Promise<void>;
  findByCustomerCodeAndType(customer_code: string, measure_type: string): Promise<Measure[]>;
  findByCustomerCode(customer_code: string): Promise<Measure[]>;
}