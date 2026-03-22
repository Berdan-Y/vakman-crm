<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Support\InvoicePdfViewData;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        ?string $locale = null,
    ) {
        // Queued mail runs without HTTP middleware; Laravel wraps send() in withLocale($this->locale, …)
        $this->locale($locale ?? config('app.locale', 'nl'));
    }

    public function envelope(): Envelope
    {
        $subject = __('mail.invoice.subject', ['company' => config('app.name')]);
        $ref = $this->invoice->invoice_number;
        if ($ref !== null && $ref !== '') {
            $subject .= ' '.$ref;
        }

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
            with: [
                'invoice' => $this->invoice,
                'recipientName' => $this->invoice->recipient_name,
                'amount' => $this->invoice->amount,
                'type' => $this->invoice->type,
            ],
        );
    }

    public function attachments(): array
    {
        $pdfContent = $this->generatePdfContent();

        return [
            Attachment::fromData(fn () => $pdfContent, 'invoice-'.$this->invoice->id.'.pdf')
                ->withMime('application/pdf'),
        ];
    }

    private function generatePdfContent(): string
    {
        $invoice = $this->invoice;
        $invoice->loadMissing([
            'company',
            'job.customer',
            'job.employee',
            'job.company',
            'billingCustomer',
            'billingEmployee',
            'lines',
        ]);

        return Pdf::loadView('invoices.pdf', InvoicePdfViewData::make($invoice))
            ->setBasePath(public_path())
            ->output();
    }
}
