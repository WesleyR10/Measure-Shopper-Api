import { Entity } from "../@shared/entity";
import { UniqueEntityID } from "../@shared/unique-entity-id";

export interface MeasureProps {
  customer_code: string;
  measure_datetime: Date;
  measure_type: string;
  image_url: string;
  measure_value?: number;
  has_confirmed: boolean;
  measure_uuid?: string;
}

export class Measure extends Entity<MeasureProps> {
  constructor(props: MeasureProps, id?: UniqueEntityID) {
    super(props, id);
    this.validate();
  }

  private validate() {
    if (!this.props.customer_code) {
      throw new Error("Customer code is required");
    }
    if (!this.props.measure_datetime) {
      throw new Error("Measure datetime is required");
    }
    if (!this.props.measure_type) {
      throw new Error("Measure type is required");
    }
    if (!this.props.image_url) {
      throw new Error("Image URL is required");
    }
    if (this.props.measure_value !== undefined && this.props.measure_value < 0) {
      throw new Error("Measure value must be greater than or equal to zero");
    }
    if (typeof this.props.has_confirmed !== "boolean") {
      throw new Error("Has confirmed must be a boolean");
    }
  }

  get customer_code(): string {
    return this.props.customer_code;
  }

  get measure_datetime(): Date {
    return this.props.measure_datetime;
  }

  get measure_type(): string {
    return this.props.measure_type;
  }

  get image_url(): string {
    return this.props.image_url;
  }

  get measure_value(): number | undefined {
    return this.props.measure_value;
  }

  set measure_value(value: number | undefined) {
    if (value !== undefined && value < 0) {
      throw new Error("Measure value must be greater than or equal to zero");
    }
    this.props.measure_value = value;
  }

  get has_confirmed(): boolean {
    return this.props.has_confirmed;
  }

  set has_confirmed(value: boolean) {
    this.props.has_confirmed = value;
  }

  get measure_uuid(): string {
    return this.id.toValue();
  }
}