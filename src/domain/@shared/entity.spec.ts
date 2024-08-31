import { Entity } from "./entity";
import { UniqueEntityID } from "./unique-entity-id";

interface TestProps {
  name: string;
}

class TestEntity extends Entity<TestProps> {
  constructor(props: TestProps, id?: UniqueEntityID) {
    super(props, id);
  }
}

describe("Entity unit tests", () => {
  it("should generate a new ID if no value is provided", () => {
    const props: TestProps = { name: "Test" };
    const entity = new TestEntity(props);
    expect(entity.id).toBeDefined();
    expect(entity.id.toValue()).toHaveLength(36); // UUID length
  });

  it("should use the provided ID if given", () => {
    const props: TestProps = { name: "Test" };
    const id = new UniqueEntityID("12345");
    const entity = new TestEntity(props, id);
    expect(entity.id.toValue()).toBe("12345");
  });

  it("should correctly compare two entities", () => {
    const props: TestProps = { name: "Test" };
    const id = new UniqueEntityID("12345");
    const entity1 = new TestEntity(props, id);
    const entity2 = new TestEntity(props, id);
    const entity3 = new TestEntity(props, new UniqueEntityID("67890"));

    expect(entity1.equals(entity2)).toBe(true);
    expect(entity1.equals(entity3)).toBe(false);
  });

  it("should return false when comparing with a different entity", () => {
    const props: TestProps = { name: "Test" };
    const entity1 = new TestEntity(props);
    const entity2 = new TestEntity({ name: "Another Test" });

    expect(entity1.equals(entity2)).toBe(false);
  });

  it("should return true when comparing with itself", () => {
    const props: TestProps = { name: "Test" };
    const entity = new TestEntity(props);

    expect(entity.equals(entity)).toBe(true);
  });
});