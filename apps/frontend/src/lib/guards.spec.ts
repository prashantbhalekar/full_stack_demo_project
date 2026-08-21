import { ensureAuthorizedUser } from "./guards";
import { apiRequest } from "./api";

jest.mock("./api", () => ({
  apiRequest: jest.fn(),
}));

describe("ensureAuthorizedUser", () => {
  const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

  it("routes pending users to pending page", async () => {
    const replace = jest.fn();
    mockedApiRequest.mockResolvedValueOnce({
      portal: "CUSTOMER",
      status: "PENDING",
      email: "pending@example.com",
    });

    const result = await ensureAuthorizedUser({ replace }, "CUSTOMER");

    expect(result).toBeNull();
    expect(replace).toHaveBeenCalledWith("/pending-approval");
  });

  it("routes rejected users to rejected page", async () => {
    const replace = jest.fn();
    mockedApiRequest.mockResolvedValueOnce({
      portal: "CUSTOMER",
      status: "REJECTED",
      email: "rejected@example.com",
    });

    const result = await ensureAuthorizedUser({ replace }, "CUSTOMER");

    expect(result).toBeNull();
    expect(replace).toHaveBeenCalledWith("/rejected");
  });

  it("routes wrong role users to login", async () => {
    const replace = jest.fn();
    mockedApiRequest.mockResolvedValueOnce({
      portal: "VENDOR",
      status: "ACTIVE",
      email: "vendor@example.com",
    });

    const result = await ensureAuthorizedUser({ replace }, "ADMIN");

    expect(result).toBeNull();
    expect(replace).toHaveBeenCalledWith("/auth/login");
  });

  it("returns user when status and role are valid", async () => {
    const replace = jest.fn();
    mockedApiRequest.mockResolvedValueOnce({
      portal: "ADMIN",
      status: "ACTIVE",
      email: "admin@example.com",
    });

    const result = await ensureAuthorizedUser({ replace }, "ADMIN");

    expect(result).toEqual({
      portal: "ADMIN",
      status: "ACTIVE",
      email: "admin@example.com",
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
