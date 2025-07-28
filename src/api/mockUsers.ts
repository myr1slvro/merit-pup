export const users = [
  {
    id: "CCIS-1001-MN",
    email: "test@email.com",
    password: "password",
    roles: ["Faculty"],
  },
  {
    id: "UTLDO-3001-MN",
    email: "admin@email.com",
    password: "adminpass",
    roles: ["UTLDO Admin"],
  },
  {
    id: "TECH-4001-MN",
    email: "tech@email.com",
    password: "techpass",
    roles: ["Technical Admin", "Faculty"],
  },
  {
    id: "CCIS-2001-MN",
    email: "evaluator@email.com",
    password: "evalpass",
    roles: ["Evaluator"],
  },
  // Example user with multiple roles:
  // {
  //   id: "MULTI-5001-MN",
  //   email: "multi@email.com",
  //   password: "multipass",
  //   roles: ["Faculty", "UTLDO Admin"]
  // },
];
