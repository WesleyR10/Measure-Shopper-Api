import { UniqueEntityID } from "./unique-entity-id";

describe("UniqueEntityID unit tests", () => {
  it("should generate a new ID if no value is provided", () => {
    const id = new UniqueEntityID();
    expect(id.toValue()).toBeDefined();
    expect(id.toValue()).toHaveLength(36); // UUID length
  });

  it("should return the string representation of the ID", () => {
    const value = "12345";
    const id = new UniqueEntityID(value);
    expect(id.toString()).toBe(value);
  });

  it("should use the provided value if given", () => {
    const value = "12345";
    const id = new UniqueEntityID(value);
    expect(id.toValue()).toBe(value);
  });

  it("should correctly compare two IDs", () => {
    const id1 = new UniqueEntityID("12345");
    const id2 = new UniqueEntityID("12345");
    const id3 = new UniqueEntityID("67890");
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });


});