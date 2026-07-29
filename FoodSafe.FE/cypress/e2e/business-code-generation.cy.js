function signInAsAdmin() {
  cy.request(
    "/api/abp/application-configuration?IncludeLocalizationResources=false",
  );
  cy.getCookie("XSRF-TOKEN").then((cookie) => {
    expect(cookie, "XSRF-TOKEN cookie").not.to.be.null;
    cy.request({
      method: "POST",
      url: "/api/account/login",
      headers: {
        RequestVerificationToken: decodeURIComponent(cookie.value),
      },
      body: {
        userNameOrEmailAddress: "admin",
        password: Cypress.env("adminPassword"),
        captchaToken: "XXXX.DUMMY.TOKEN.XXXX",
        rememberMe: false,
      },
    })
      .its("body.result")
      .should("equal", 1);
  });
}

describe("business code suggestion and dropdown sizing", () => {
  it("suggests a code immediately and renders readable dropdowns", () => {
    signInAsAdmin();
    cy.visit("/businesses");
    cy.contains("button", /thêm cơ sở/i).click();

    cy.get('input[aria-label="Đơn vị quản lý"]')
      .parents(".ant-select")
      .first()
      .then(($control) => {
        const controlWidth = $control[0].getBoundingClientRect().width;
        cy.get('input[aria-label="Đơn vị quản lý"]').click();
        cy.get(".ant-select-dropdown:visible")
          .should("be.visible")
          .then(($dropdown) => {
            expect($dropdown[0].getBoundingClientRect().width).to.be.greaterThan(
              controlWidth,
            );
          });
      });

    cy.get(".ant-select-dropdown:visible")
      .contains(/PYT-HL — Phòng Y tế TP Hạ Long/)
      .click();
    cy.get('input[aria-label="Mã cơ sở"]')
      .invoke("val")
      .should("match", /^CS-HL-\d{4,}$/);

    cy.get('input[aria-label="Loại hình"]')
      .parents(".ant-select")
      .first()
      .then(($control) => {
        const controlWidth = $control[0].getBoundingClientRect().width;
        cy.get('input[aria-label="Loại hình"]').click();
        cy.get(".ant-select-dropdown:visible")
          .should("be.visible")
          .then(($dropdown) => {
            expect($dropdown[0].getBoundingClientRect().width).to.be.greaterThan(
              controlWidth,
            );
          });
      });
  });
});
