package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.Size;


public record UpdatePaymentRequest(

		/*
		 * Camp lists only - rejected on any other kind.
		 */
		Boolean contractReturned,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
