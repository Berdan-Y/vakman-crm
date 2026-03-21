<?php

namespace App\Mail;

use App\Models\Invoice;
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
    ) {}

    public function envelope(): Envelope
    {
        $subject = __('mail.invoice.subject', ['company' => config('app.name')]).' '.$this->invoice->invoice_number;

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
        $invoice->load('job.customer', 'job.company', 'lines');

        $companyName = $invoice->job->company->name ?? config('app.name');
        $customer = $invoice->job->customer;

        $invoiceData = [
            'id' => $invoice->id,
            'type' => $invoice->type,
            'recipient_name' => $invoice->recipient_name,
            'recipient_email' => $invoice->recipient_email,
            'amount' => (float) $invoice->amount,
            'status' => $invoice->status,
            'created_at' => $invoice->created_at->toIso8601String(),
            'sent_at' => $invoice->sent_at?->toIso8601String(),
        ];

        $invoiceLines = $invoice->lines->map(fn ($line) => [
            'id' => $line->id,
            'description' => $line->description,
            'quantity' => (float) $line->quantity,
            'unit_price' => (float) $line->unit_price,
            'total' => (float) $line->total,
        ])->toArray();

        $job = [
            'id' => $invoice->job->id,
            'description' => $invoice->job->description,
            'date' => $invoice->job->date->format('Y-m-d'),
            'scheduled_time' => $invoice->job->scheduled_time
                ? (is_string($invoice->job->scheduled_time)
                    ? substr($invoice->job->scheduled_time, 0, 5)
                    : $invoice->job->scheduled_time->format('H:i'))
                : null,
            'invoice_number' => $invoice->job->invoice_number,
        ];

        $customerData = $customer ? [
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'street' => $customer->street,
            'house_number' => $customer->house_number,
            'house_number_addition' => $customer->house_number_addition,
            'zip_code' => $customer->zip_code,
            'city' => $customer->city,
        ] : null;

        $invoiceDate = \Carbon\Carbon::parse($invoiceData['created_at'])->locale('nl_NL')->translatedFormat('j F Y');
        $sentAt = $invoiceData['sent_at']
            ? \Carbon\Carbon::parse($invoiceData['sent_at'])->locale('nl_NL')->translatedFormat('j F Y')
            : null;

        $streetHouseNumber = $customerData['street'].' '.$customerData['house_number'];
        if ($customerData['house_number_addition'] ?? null) {
            $streetHouseNumber .= ' '.$customerData['house_number_addition'];
        }

        $addressLine = implode(', ', array_filter([
            $streetHouseNumber,
            $customerData['zip_code'] ?? null,
            $customerData['city'] ?? null,
        ]));

        $amountFormatted = '€ '.number_format((float) $invoiceData['amount'], 2, ',', ' ');

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoiceData,
            'invoice_lines' => $invoiceLines,
            'job' => $job,
            'customer' => $customerData,
            'company_name' => $companyName,
            'invoice_date' => $invoiceDate,
            'sent_at' => $sentAt,
            'address_line' => $addressLine,
            'amount_formatted' => $amountFormatted,
        ])
            ->setBasePath(public_path());

        return $pdf->output();
    }
}
