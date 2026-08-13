package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.PaymentMethod;
import jakarta.validation.constraints.Size;

public record UpdatePaymentRequest(

		/*
		 * Camp lists only - rejected on any other kind.
		 */
		Boolean contractReturned,

		PaymentMethod paymentMethod,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
