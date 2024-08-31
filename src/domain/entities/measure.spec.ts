import MockDate from "mockdate";
import { Measure, MeasureProps } from "./measure";
import { UniqueEntityID } from "../@shared/unique-entity-id";

const fakeMeasureProps: MeasureProps = {
  customer_code: "customer_code",
  measure_datetime: new Date(),
  measure_type: "type",
  image_url: "http://example.com/image.jpg",
  measure_value: 10,
  has_confirmed: true,
  measure_uuid: '88d8ad12-1f18-4328-86ab-9273d435e422' // UUID fixo para consistência
};

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'generated-uuid')
}));

describe("Measure unit tests", () => {
  beforeAll(() => {
    MockDate.set(new Date());
  });

  afterAll(() => {
    MockDate.reset();
  });

  let measure: Measure;

  beforeEach(() => {
    measure = new Measure(fakeMeasureProps);
  });

  it("should generate a new ID if no value is provided", () => {
    expect(measure.id).toBeDefined();
    expect(measure.id.toValue()).toHaveLength(36); // UUID length
  });

  it("should use the provided ID if given", () => {
    const id = new UniqueEntityID("12345");
    measure = new Measure(fakeMeasureProps, id);
    expect(measure.id.toValue()).toBe("12345");
  });

it("should throw error when customer_code is empty", () => {
  expect(() => {
    const props = { ...fakeMeasureProps, customer_code: "" };
    new Measure(props);
  }).toThrowError("Customer code is required");
});

it("should throw error when measure_datetime is missing", () => {
  expect(() => {
    const props = { ...fakeMeasureProps, measure_datetime: null as any };
    new Measure(props);
  }).toThrowError("Measure datetime is required");
});

it("should throw error when measure_type is empty", () => {
  expect(() => {
    const props = { ...fakeMeasureProps, measure_type: "" };
    new Measure(props);
  }).toThrowError("Measure type is required");
});

it("should throw error when image_url is empty", () => {
  expect(() => {
    const props = { ...fakeMeasureProps, image_url: "" };
    new Measure(props);
  }).toThrowError("Image URL is required");
});

it("should throw error when measure_value is less than zero", () => {
  expect(() => {
    const props = { ...fakeMeasureProps, measure_value: -1 };
    new Measure(props);
  }).toThrowError("Measure value must be greater than or equal to zero");
});

it("should throw error when has_confirmed is not a boolean", () => {
  expect(() => {
    const props = { ...fakeMeasureProps, has_confirmed: null as any };
    new Measure(props);
  }).toThrowError("Has confirmed must be a boolean");
});

  it("should change measure_value (setter)", () => {
    measure.measure_value = 20;
    expect(measure.measure_value).toBe(20);
  });

  it("should throw error when setting measure_value to less than zero (setter)", () => {
    expect(() => {
      measure.measure_value = -1;
    }).toThrowError("Measure value must be greater than or equal to zero");
  });

  it("should change has_confirmed (setter)", () => {
    measure.has_confirmed = false;
    expect(measure.has_confirmed).toBe(false);
  });

  it("should return customer_code (getter)", () => {
    expect(measure.customer_code).toBe(fakeMeasureProps.customer_code);
  });

  it("should return measure_datetime (getter)", () => {
    expect(measure.measure_datetime).toBeInstanceOf(Date);
  });

  it("should return measure_type (getter)", () => {
    expect(measure.measure_type).toBe(fakeMeasureProps.measure_type);
  });

  it("should return image_url (getter)", () => {
    expect(measure.image_url).toBe(fakeMeasureProps.image_url);
  });

  it("should return measure_value (getter)", () => {
    expect(measure.measure_value).toBe(fakeMeasureProps.measure_value);
  });

  it("should return has_confirmed (getter)", () => {
    expect(measure.has_confirmed).toBe(fakeMeasureProps.has_confirmed);
  });

  it("should return measure_uuid (getter)", () => {
    const id = new UniqueEntityID(fakeMeasureProps.measure_uuid);
    const measure = new Measure(fakeMeasureProps, id);
    
    expect(measure.measure_uuid).toBe(measure.id.toValue());
  });

  it("should generate measure_uuid if not provided", () => {
    const propsWithoutUUID = { ...fakeMeasureProps, measure_uuid: undefined };
    const measure = new Measure(propsWithoutUUID);
    expect(measure.measure_uuid).toBe('generated-uuid');
  });
});