package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.PaymentLine;
import atomdance.app.modules.finance.model.PaymentLineKind;

import java.math.BigDecimal;
import java.util.UUID;


public record PaymentLineView(
		UUID id,
		String code,
		PaymentLineKind kind,
		UUID membershipId,
		UUID groupId,
		String description,
		BigDecimal unitCost,
		BigDecimal quantity,
		BigDecimal gross,
		BigDecimal discountPercent,
		BigDecimal discountAmount,
		BigDecimal subtotal
) {

	public static PaymentLineView from(PaymentLine line) {
		return new PaymentLineView(
				line.getId(),
				line.getCode(),
				line.getKind(),
				line.getMembership() == null ? null : line.getMembership().getId(),
				line.getGroup() == null ? null : line.getGroup().getId(),
				line.getDescription(),
				line.getUnitCost(),
				line.getQuantity(),
				line.getGross(),
				line.getDiscountPercent(),
				line.getDiscountAmount(),
				line.getSubtotal()
		);
	}
}
